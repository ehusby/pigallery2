export const SupportedFormats = {
  Photos: [
    'gif',
    'jpeg', 'jpg', 'jpe',
    'png',
    'webp',
    'svg'
  ],
  // Browser supported video formats
  // Read more:  https://www.w3schools.com/html/html5_video.asp
  Videos: [
    'mp4',
    'webm',
    'ogv',
    'ogg'
  ],
  MetaFiles: [
    'gpx', 'pg2conf'
  ],
  // These formats need to be transcoded (with the build-in ffmpeg support)
  TranscodeNeed: {
    // based on libvips, all supported formats for sharp: https://github.com/libvips/libvips
    // all supported formats for gm: http://www.graphicsmagick.org/GraphicsMagick.html
    Photos: <string[]>[],
    Videos: [
      'avi', 'mkv', 'mov', 'wmv', 'flv', 'mts', 'm2ts', 'mpg', '3gp', 'm4v', 'mpeg', 'vob',
      'divx', 'xvid', 'ts'
    ],
  },
  WithDots: {
    Photos: <string[]>[],
    Videos: <string[]>[],
    MetaFiles: <string[]>[],
    TranscodeNeed: {
      Photos: <string[]>[],
      Videos: <string[]>[],
    }
  }
};

SupportedFormats.Photos = SupportedFormats.Photos.concat(SupportedFormats.TranscodeNeed.Photos);
SupportedFormats.Videos = SupportedFormats.Videos.concat(SupportedFormats.TranscodeNeed.Videos);
SupportedFormats.WithDots.Photos = SupportedFormats.Photos.map(f => '.' + f);
SupportedFormats.WithDots.Videos = SupportedFormats.Videos.map(f => '.' + f);
SupportedFormats.WithDots.MetaFiles = SupportedFormats.MetaFiles.map(f => '.' + f);
SupportedFormats.WithDots.TranscodeNeed.Photos = SupportedFormats.TranscodeNeed.Photos.map(f => '.' + f);
SupportedFormats.WithDots.TranscodeNeed.Videos = SupportedFormats.TranscodeNeed.Videos.map(f => '.' + f);

