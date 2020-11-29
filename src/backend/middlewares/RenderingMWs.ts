import {NextFunction, Request, Response} from 'express';
import {ErrorCodes, ErrorDTO} from '../../common/entities/Error';
import {Message} from '../../common/entities/Message';
import {Config, PrivateConfigClass} from '../../common/config/private/Config';
import {UserDTO, UserRoles} from '../../common/entities/UserDTO';
import {NotificationManager} from '../model/NotifocationManager';
import {Logger} from '../Logger';
import {SharingDTO} from '../../common/entities/SharingDTO';
import {Utils} from '../../common/Utils';

export class RenderingMWs {

  public static renderResult(req: Request, res: Response, next: NextFunction) {
    if (typeof req.resultPipe === 'undefined') {
      return next();
    }

    return RenderingMWs.renderMessage(res, req.resultPipe);
  }


  public static renderSessionUser(req: Request, res: Response, next: NextFunction) {
    if (!(req.session.user)) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'User not exists'));
    }

    const user = <UserDTO>{
      id: req.session.user.id,
      name: req.session.user.name,
      csrfToken: req.session.user.csrfToken || req.csrfToken(),
      role: req.session.user.role,
      usedSharingKey: req.session.user.usedSharingKey,
      permissions: req.session.user.permissions
    };

    if (!user.csrfToken && req.csrfToken) {
      user.csrfToken = req.csrfToken();
    }

    RenderingMWs.renderMessage(res, user);
  }

  public static renderSharing(req: Request, res: Response, next: NextFunction) {
    if (!req.resultPipe) {
      return next();
    }

    const {password, creator, ...sharing} = req.resultPipe;
    RenderingMWs.renderMessage(res, sharing);
  }


  public static renderSharingList(req: Request, res: Response, next: NextFunction) {
    if (!req.resultPipe) {
      return next();
    }

    const shares: SharingDTO[] = Utils.clone(req.resultPipe);
    shares.forEach(s => {
      delete s.password;
      delete s.creator.password;
    });
    return RenderingMWs.renderMessage(res, shares);
  }

  public static renderFile(req: Request, res: Response, next: NextFunction) {
    if (!req.resultPipe) {
      return next();
    }
    return res.sendFile(req.resultPipe, {maxAge: 31536000, dotfiles: 'allow'});
  }

  public static renderOK(req: Request, res: Response, next: NextFunction) {
    const message = new Message<string>(null, 'ok');
    res.json(message);
  }


  public static async renderConfig(req: Request, res: Response, next: NextFunction) {
    const originalConf = await Config.original();
    originalConf.Server.sessionSecret = null;
    const message = new Message<PrivateConfigClass>(null, <any>originalConf.toJSON({
      attachState: true,
      attachVolatile: true
    }));
    res.json(message);
  }


  public static renderError(err: any, req: Request, res: Response, next: NextFunction): any {

    if (err instanceof ErrorDTO) {
      if (err.details) {
        Logger.warn('Handled error:');
        console.log(err);
        delete (err.details); // do not send back error object to the client side

        // hide error details for non developers
        if (!(req.session.user && req.session.user.role >= UserRoles.Developer)) {
          delete (err.detailsStr);
        }
      }
      const message = new Message<any>(err, null);
      return res.json(message);
    }
    NotificationManager.error('unknown server error', err);
    return next(err);
  }


  protected static renderMessage<T>(res: Response, content: T) {
    const message = new Message<T>(null, content);
    res.json(message);
  }


}
