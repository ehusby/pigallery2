export class FFmpegFactory {
  public static get(): any {
    const ffmpeg = require('fluent-ffmpeg');
    try {
      const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
      ffmpeg.setFfmpegPath(ffmpegPath);
      const ffprobePath = require('@ffprobe-installer/ffprobe').path;
      ffmpeg.setFfprobePath(ffprobePath);
    } catch (e) {
    }
    return ffmpeg;
  }
}
