import * as gulp from 'gulp';
import * as fs from 'fs';
import {promises as fsp} from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as zip from 'gulp-zip';
import * as ts from 'gulp-typescript';
import * as xml2js from 'xml2js';
import * as child_process from 'child_process';
// @ts-ignore
import * as jeditor from 'gulp-json-editor';
import {XLIFF} from 'xlf-google-translate';
import {PrivateConfigClass} from './src/common/config/private/Config';
import {ConfigClassBuilder} from 'typeconfig/src/decorators/builders/ConfigClassBuilder';

const execPr = util.promisify(child_process.exec);

const translationFolder = 'translate';
const tsBackendProject = ts.createProject('tsconfig.json');
declare var process: NodeJS.Process;

const getSwitch = (name: string, def: string = null): string => {
  name = '--' + name;
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i].startsWith(name + '=')) {
      return process.argv[i].replace(name + '=', '').trim();
    }
    if (process.argv[i].startsWith(name)) {
      if (i + 1 < process.argv.length) {
        return process.argv[i + 1].trim();
      }
      return 'true';
    }
  }
  return def;
};

gulp.task('build-backend', function () {
  return gulp.src([
    'src/common/**/*.ts',
    'src/backend/**/*.ts'], {base: '.'})
    .pipe(tsBackendProject())
    .js
    .pipe(gulp.dest('./release'));

});


const createDynamicTranslationFile = async (language: string) => {
  // load
  const folder = './src/frontend/' + translationFolder;
  const data: string = await fsp.readFile(path.join(folder, `messages.${language}.xlf`), 'utf-8');
  const translationXml: XLIFF.Root = await xml2js.parseStringPromise(data);

  // clean translations, keep only .ts transaltions
  const hasTsTranslation = (cg: XLIFF.ContextGroup) =>
    cg.context.findIndex((c: any) => c.$['context-type'] === 'sourcefile' && c._.endsWith('.ts')) !== -1;
  const translations = translationXml.xliff.file[0].body[0]['trans-unit'];
  const filtered = translations.filter(tr => tr['context-group'].findIndex(hasTsTranslation) !== -1);
  filtered.forEach(tr => delete tr['context-group']);
  translationXml.xliff.file[0].body[0]['trans-unit'] = filtered;

  // save
  const builder = new xml2js.Builder({trim: true, normalize: true});
  const xml = builder.buildObject(translationXml);
  await fsp.writeFile(path.join(folder, `ts-only-msg.${language}.xlf`), xml);

};

const removeDynamicTranslationFile = async (language: string) => {
  const translationFile = path.join('./src/frontend/', translationFolder, `ts-only-msg.${language}.xlf`);
  fsp.unlink(translationFile);
};


const setDynTransFileAtAppModule = async (language: string) => {
  const file = './src/frontend/app/app.module.ts';
  let data: string = await fsp.readFile(file, 'utf-8');
  const from = 'messages.${locale}.xlf';
  const to = `ts-only-msg.${language}.xlf`;
  data = data.replace(from, to);
  await fsp.writeFile(file, data);
};

const resetAppModule = async (language: string) => {
  const file = './src/frontend/app/app.module.ts';
  let data: string = await fsp.readFile(file, 'utf-8');
  const from = 'messages.${locale}.xlf';
  const to = `ts-only-msg.${language}.xlf`;
  data = data.replace(to, from);
  await fsp.writeFile(file, data);
};


const createFrontendTask = (type: string, language: string, script: string) => {
  gulp.task(type, async (cb) => {
    let error;
    try {
      // TODO: remove this once i18n-pollify is removed from the project
      // Adding filtered translation as webpack would pack all translations into the created release
      await createDynamicTranslationFile(language);
      await setDynTransFileAtAppModule(language);
      const {stdout, stderr} = await execPr(script);
      console.log(stdout);
      console.error(stderr);
    } catch (e) {
      console.error(e);
      error = e;
    } finally {
      try {
        await resetAppModule(language);
      } catch (e) {

      }
      try {
        await removeDynamicTranslationFile(language);
      } catch (e) {

      }
      cb(error);
    }
  });
};


const getLanguages = () => {
  if (!fs.existsSync('./src/frontend/' + translationFolder)) {
    return [];
  }
  const dirCont = fs.readdirSync('./src/frontend/' + translationFolder);
  const files: string[] = dirCont.filter((elm) => {
    return elm.match(/.*\.[a-zA-Z]+\.(xlf)/ig);
  });

  // get languages to filter
  let languageFilter: string[] = null;
  if (getSwitch('languages')) {
    languageFilter = getSwitch('languages').split(',');
  }

  let languages = files.map((f: string) => {
    return f.split('.')[1];
  });

  if (languageFilter !== null) {
    languages = languages.filter((l) => {
      return languageFilter.indexOf(l) !== -1;
    });
  }
  return languages;
};

gulp.task('build-frontend', (() => {
  const languages = getLanguages().filter((l) => {
    return l !== 'en';
  });
  const tasks = [];
  createFrontendTask('build-frontend-release default', 'en',
    'ng build --aot --prod --output-path=./release/dist --no-progress --i18n-locale=en' +
    ' --i18n-format xlf --i18n-file src/frontend/' + translationFolder + '/messages.en.xlf' +
    ' --i18n-missing-translation warning');
  tasks.push('build-frontend-release default');
  for (let i = 0; i < languages.length; i++) {
    createFrontendTask('build-frontend-release ' + languages[i], languages[i],
      'ng build --aot --prod --output-path=./release/dist/' + languages[i] +
      ' --no-progress --i18n-locale=' + languages[i] +
      ' --i18n-format xlf --i18n-file src/frontend/' + translationFolder + '/messages.' + languages[i] + '.xlf' +
      ' --i18n-missing-translation warning');
    tasks.push('build-frontend-release ' + languages[i]);
  }
  return gulp.series(...tasks);
})());

gulp.task('copy-static', function () {
  return gulp.src([
    'src/backend/model/diagnostics/blank.jpg',
    'README.md',
    //  'package-lock.json', should not add, it keeps optional packages optional even with --force-opt-packages.
    'LICENSE'], {base: '.'})
    .pipe(gulp.dest('./release'));
});

gulp.task('copy-package', function () {
  return gulp.src([
    'package.json'], {base: '.'})
    .pipe(jeditor((json: {
      devDependencies: { [key: string]: string },
      scripts: { [key: string]: string },
      dependencies: { [key: string]: string },
      optionalDependencies: { [key: string]: string },
      buildTime: string,
      buildCommitHash: string
    }) => {
      delete json.devDependencies;
      json.scripts = {start: 'node ./src/backend/index.js'};

      if (getSwitch('skip-opt-packages')) {
        const skipPackages = getSwitch('skip-opt-packages').split(',');
        for (const pkg of skipPackages) {
          for (const key of Object.keys(json.optionalDependencies)) {
            if (key.indexOf(pkg) !== -1) {
              delete json.optionalDependencies[key];
            }
          }
        }
      }

      if (!!getSwitch('force-opt-packages')) {
        for (const key of Object.keys(json.optionalDependencies)) {
          json.dependencies[key] = json.optionalDependencies[key];
        }
        delete json.optionalDependencies;
      }
      json.buildTime = (new Date()).toISOString();

      try {
        json.buildCommitHash = require('child_process').execSync('git rev-parse HEAD').toString().trim();
      } catch (e) {
      }

      return json;
    }))
    .pipe(gulp.dest('./release'));
});


gulp.task('zip-release', function () {
  return gulp.src(['release/**/*'], {base: './release'})
    .pipe(zip('pigallery2.zip'))
    .pipe(gulp.dest('.'));
});

gulp.task('create-release', gulp.series('build-frontend', 'build-backend', 'copy-static', 'copy-package', 'zip-release'));


const simpleBuild = (isProd: boolean) => {
  const languages = getLanguages().filter((l) => {
    return l !== 'en';
  });
  const tasks = [];
  let cmd = 'ng build --aot ';
  if (isProd) {
    cmd += ' --prod --no-extract-licenses ';
  }
  createFrontendTask('build-frontend default', 'en', cmd + '--output-path=./dist --no-progress --no-progress --i18n-locale en' +
    ' --i18n-format=xlf --i18n-file=src/frontend/' + translationFolder + '/messages.en.xlf' + ' --i18n-missing-translation warning');
  tasks.push('build-frontend default');
  if (!process.env.CI) { // don't build languages if running in CI
    for (let i = 0; i < languages.length; i++) {
      createFrontendTask('build-frontend ' + languages[i], languages[i], cmd +
        '--output-path=./dist/' + languages[i] +
        ' --no-progress --i18n-locale ' + languages[i] +
        ' --i18n-format=xlf --i18n-file=src/frontend/' + translationFolder +
        '/messages.' + languages[i] + '.xlf' + ' --i18n-missing-translation warning');
      tasks.push('build-frontend ' + languages[i]);
    }
  }
  return gulp.series(...tasks);
};

gulp.task('extract-locale', async (cb) => {
  console.log('creating source translation file:  locale.source.xlf');
  try {
    {
      const {stdout, stderr} = await execPr('ng xi18n --out-file=./../../locale.source.xlf  --i18n-format=xlf --i18n-locale=en',
        {maxBuffer: 1024 * 1024});
      console.log(stdout);
      console.error(stderr);
    }
    {
      const {stdout, stderr} = await execPr('ngx-extractor -i src/frontend/**/*.ts -f xlf --out-file locale.source.xlf');
      console.log(stdout);
      console.error(stderr);
    }
    cb();
  } catch (e) {
    console.error(e);
    return cb(e);
  }
});

const translate = async (list: any[], cb: (err?: any) => void) => {
  try {
    const localsStr = '"[\\"' + list.join('\\",\\"') + '\\"]"';
    const {stdout, stderr} = await execPr('xlf-google-translate ' +
      '--source-lang="en" ' +
      '--source-file="./locale.source.xlf" ' +
      '--destination-filename="messages" ' +
      '--destination-folder="./src/frontend/"' + translationFolder + ' --destination-languages=' + localsStr);
    console.log(stdout);
    console.error(stderr);
    cb();
  } catch (e) {
    console.error(e);
    return cb(e);
  }
};
const merge = async (list: any[], cb: (err?: any) => void) => {
  try {
    const localsStr = '"[\\"' + list.join('\\",\\"') + '\\"]"';
    const {stdout, stderr} = await execPr('xlf-google-translate ' +
      '--method="extend-only" ' +
      '--source-lang="en" ' +
      '--source-file="./locale.source.xlf" ' +
      '--destination-filename="messages" ' +
      '--destination-folder="./src/frontend/"' + translationFolder + ' --destination-languages=' + localsStr);
    console.log(stdout);
    console.error(stderr);
    cb();
  } catch (e) {
    console.error(e);
    return cb(e);
  }
};

gulp.task('update-translation-only', function (cb) {
  translate(getLanguages(), cb).catch(console.error);
});
gulp.task('merge-translation-only', function (cb) {
  merge(getLanguages(), cb).catch(console.error);
});

gulp.task('update-translation', gulp.series('extract-locale', 'update-translation-only'));

gulp.task('merge-new-translation', gulp.series('extract-locale', 'merge-translation-only'));


gulp.task('add-translation-only', (cb) => {
  const languages = getLanguages();
  let lng = null;
  for (let i = 0; i < process.argv.length - 1; i++) {
    if (process.argv[i] === 'add-translation') {
      lng = process.argv[i + 1].replace('--', '');
    }
  }
  if (lng == null) {
    console.error('Error: set language with \'--\' e.g: npm run add-translation -- --en');
    return cb();
  }
  if (languages.indexOf(lng) !== -1) {
    console.error('Error: language already exists, can\'t add. These language(s) already exist(s): ' + languages);
    return cb();
  }
  translate([lng], cb);
});

gulp.task('generate-man', async (cb) => {
  const defCFG =  ConfigClassBuilder.attachInterface(new PrivateConfigClass());
  defCFG.Server.sessionSecret = [];
  let txt = '# Pigallery 2 man page\n';
  txt += 'pigallery2 uses [typeconfig](https://github.com/bpatrik/typeconfig) for configuration\n\n';
  txt += '`npm start -- --help` prints the following:\n\n';
  txt += '```\n' + ConfigClassBuilder.attachPrivateInterface(defCFG).__printMan() + '```';
  txt += '\n\n ### `config.json` sample:\n';
  txt += '```json\n' + JSON.stringify(defCFG, null, 4) + '```';
  await fsp.writeFile('MANPAGE.md', txt);
  cb();
});

gulp.task('add-translation', gulp.series('extract-locale', 'add-translation-only'));


gulp.task('build-dev', simpleBuild(false));
gulp.task('build-prod', simpleBuild(true));
