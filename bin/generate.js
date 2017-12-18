
const fs = require('fs');
const path = require('path');

//
// core
//
const writeFile = ( name, content ) => {
  console.log(`    Creating file ${name}`);
  return new Promise( (resolve, reject) => {
    if( typeof content === 'string' ) {
      content = content.replace(/\\\\/g, '/');
    }
    fs.writeFile(name, content, (err) => {
      if( err ) {
        return reject(err);
      }
      return resolve(true);
    });
  });
};




const createFolder = ( name ) => {
  console.log(`    Creating directory ${name}`);
  return new Promise( (resolve, reject) => {
    fs.mkdir(name, err => {
      if( err ) {
        if( err.code === 'EEXIST' ) {
          // If it already exists, we're fiiiiine
          return resolve(true);
        }
        
        // Otherwise, we're not
        return reject(err);
      }
      resolve(true);
    })
  });
};




const createTree = ( config, tree, previous ) => {
  if( typeof previous === 'undefined' ) {
    previous = '.';
  }
  
  const thingsToDo = [];
  Object.keys(tree).forEach(key => {
    const filepath = path.join(previous, key);
    
    if( typeof tree[key] === 'object' ) {
      thingsToDo.push(createFolder(filepath).then( res => {
        return createTree(config, tree[key], filepath)
      }));
    }
    if( typeof tree[key] === 'function' ) {
      thingsToDo.push(tree[key](config).then(contents => {
        return writeFile(filepath, contents);
      }));
    }
  });
  
  return Promise.all(thingsToDo);
};




const strip = (text) => {
  // Split all the lines
  const lines = text.split('\n');
  console.log(`    Trimming ${lines.length} lines`);
  
  // Get the first line of the file with content
  let firstLineIndex = 0;
  while( lines[firstLineIndex].length < 1 ) {
    firstLineIndex++;
  }
  
  // Get the length of the file to trim
  const trimmedLine = lines[firstLineIndex].trimLeft();
  const lengthToTrim = lines[firstLineIndex].length - trimmedLine.length;
  
  // Finally return a promise with our trimmed file
  return Promise.resolve( lines.map( line => {
    return line.substr(lengthToTrim);
  }).join('\n'));
};










//
// Our files
//


const createEslintConfigFile = (config) => {
  return Promise.resolve(JSON.stringify({
    "env": {
      "browser": true,
      "node": true,
    },
    "rules": {
      "comma-dangle": ["error", "only-multiline"],
    },
    "globals": {
      "document": false,
      "React": false,
      "ReactDOM": false,
    },
    "extends": "airbnb",
    "plugins": [
      "react",
      "jsx-a11y",
      "import"
    ]}, null, 2));
};




const createBabelRc = (config) => {
  return Promise.resolve(`{
  "presets": [
    ["env", {"modules": false}],
    "stage-1",
    "react"
  ],
  "plugins": [
    "transform-runtime"
  ]
}`);
};





const createWebpack = (config) => {
  return Promise.resolve(`const path = require('path');

module.exports = {
  entry: './client/src/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  resolve: {
    extensions: [".js", ".json", ".jsx"],
  },
  module: {
    rules: [
      {
        test: { or: [ /.js$/, /.jsx$/ ]},
        include: [
          path.resolve(__dirname, 'client/src')
        ],
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
      },
    ],
  },
};
`);
};





const createStylesheet = (config) => {
  return Promise.resolve(`
body {
  background: #333;
  color: #FFF;
}
`);
};





const createAppIcon = (config) => {
  return new Promise( (resolve, reject) => {
    fs.readFile( 'icon.png', (err, contents) => {
      if ( err ) {
        return reject(err);
      }
      
      resolve(contents);
    });
  });
}






const createGulpfile = (config) => {
    // TODO: check if we should minify or not
  return Promise.resolve(`
const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const less = require('gulp-less');
//const minifyCSS = require('gulp-csso');
const sourcemaps = require('gulp-sourcemaps');
const webpack = require('webpack');

gulp.task('webpack', (callback) => {
  webpack(require('./webpack.config.js'), (err, stats) => {
    callback();
  });
});

gulp.task('icon', (callback) => {
  callback();
});

gulp.task('less', () => {
  return gulp.src('./client/style/app.less')
    .pipe(sourcemaps.init())
    .pipe(less())
    //.pipe(minifyCSS())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./public'));
});

gulp.task('default', ['less', 'webpack']);
`);
};






const createLogger = (config) => {
  return Promise.resolve(`
const bunyan = require('bunyan');

module.exports = bunyan.createLogger({
  name: '${config.projectName}',
  src: true,
});
`);  
};





const createIndexTemplate = (config) => {
  // TODO: add google analytics
  return Promise.resolve(`<!DOCTYPE html>
<html class="no-js" lang="en">
  <head>
    <title>{{ title }}</title>
    
    <meta charset="utf-8"/>
    <meta http-equiv="x-ua-compatible" content="ie=edge"/>
    <meta name="description" content="{{ description }}"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    
    <link rel="manifest" href="/manifest.json"/>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous"/>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"/>
    <link rel="stylesheet" href="https://bootswatch.com/4/lux/bootstrap.min.css"/>
    <link rel="stylesheet" href="/app.css"/>
  </head>
  <body>
    <noscript>
      <p>Javascript makes the internet fun. Sure this website could be malware, sure it could try to steal your information, or exploit your gpu to mine bitcoins.</p>
      
      <p>Sure.</p>
      
      <p>But we still need it to work.</p>
    </noscript>
    <div id="root"></div>
    <div id="scripts">
      <script src="https://code.jquery.com/jquery-3.1.1.slim.min.js" integrity="sha384-A7FZj7v+d/sdmMqp/nOQwliLvUsJfDHW+k9Omg/a/EheAdgtzNs3hpfag6Ed950n" crossorigin="anonymous"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js" integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js" integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>
      <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
      <script src="/bundle.js"></script>
    </div>
  </body>
</html>
`);
};






const createApp = (config) => {
  return Promise.resolve(`
const path = require('path');
const express = require('express');
const hbs = require('express-hbs');

// Local modules
const logger = require('./lib/logger');
const pkg = require('../package');

// Create the app
const app = express();

// Set up static assets
app.use(express.static('public'));

// Set up templating engine
app.engine('html', hbs.express4());
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '${config.viewsDir}'));

// App configuration
const config = {
  name: pkg.name,
  description: pkg.description,
  version: pkg.version,
  port: process.env.PORT || 3000,
};

// Add logging to each route
app.use((req, res, next) => {
  logger.info({
    request: req.originalUrl,
    resolve: req.path,
    origin: req.ip === '::1' ? 'localhost' : req.ip,
  });
  next();
});

// Main route
app.get('/', (req, res) => {
  res.render('index', {
    title: '${config.projectName}',
    description: '${config.description}',
  });
});

// Listen on configured port
app.listen(config.port, () => {
  logger.info([config.name, 'version', config.version, 'running on port', config.port].join(' '));
});
`);
};




const createREADME = (config) => {
  return Promise.resolve(`
This is a generated project that makes decisions to 

# ${config.projectName}

${config.description}

`);
};




const createGitIgnore = (config) => {
  return Promise.resolve([
    '# generated public files',
    'public',
    '# nodejs stuff',
    'node_modules',
  ].join('\n'));
};




const createNodemonConfig = (config) => {
  return Promise.resolve(JSON.stringify({
    "ext": "js json jsx less",
    "env": {
      "NODE_ENV": "development"
    },
    "verbose": true,
    "watch": [
      config.serverFolder,
      config.clientFolder,
    ],
    "events": {
      // TODO: rebuild only when client folder changes
      "restart": "gulp"
    },
  }, null, 2));
};





const createPackage = (config) => {
  const appPath = path.join(config.serverFolder, config.appFileName);
  
  return Promise.resolve(JSON.stringify({
    name: config.projectName,
    main: appPath,
    description: config.description,
    author: 'Etskh',
    license: 'MIT',
    version: '0.0.1',
    scripts: {
      build: 'gulp',
      dev: 'nodemon',
      start: 'node ' + appPath,
      lint: ['eslint', config.serverFolder, config.clientFolder].join(' '),
      webpack: 'webpack',
    },
    '//': 'don\t need react, react-dom because we\'re doing CDN',
    dependencies: {
      bunyan: '^1.8.12',
      express: '^4.16.2',
      "express-hbs": '^1.0.4',
    },
    devDependencies: {
      "babel-core": "^6.26.0",
      "babel-loader": "^7.1.2",
      "babel-plugin-transform-runtime": "^6.23.0",
      "babel-preset-env": "^1.6.1",
      "babel-preset-react": "^6.24.1",
      "babel-preset-stage-1": "^6.24.1",
      eslint: "^4.13.1",
      "eslint-config-airbnb": "^16.1.0",
      "eslint-plugin-import": "^2.8.0",
      "eslint-plugin-jsx-a11y": "^6.0.2",
      "eslint-plugin-react": "^7.5.1",
      gulp: "^3.9.1",
      "gulp-less": "^3.3.2",
      "gulp-sourcemaps": "^2.6.1",
      "gulp-util": "^3.0.8",
      jasmine: "^2.8.0",
      nodemon: '^1.12.5',
      webpack: '^3.10.0',
    },
  }, null, 2));
};





























const createPngScript = (config) => {
  return strip(`
    // this is a png script that does PNG stuff with pure js
    const fs = require('fs');
    const zlib = require('zlib');
    const crc = require('crc');
    
    const getPixelsFromBox = (buf, box, width, bytesPerPixel) => {
      let pixels = [];
      for( var y = box.topLeft.y; y < box.botRight.y; y++ ) {
        if( y < 0 || y >= this.height ) {
          continue;
        }
        
        for( var x = box.topLeft.x; x < box.botRight.x; x++ ) {
          if( x < 0 || x >= this.weight ) {
            continue;
          }
          
          // get the pixel data here!
          const offset = bytesPerPixel * ( width * y + x);
          if( offset + bytesPerPixel > buf.length) {
            continue;
          }
          const pixelBuffer = [];
          for(var p=0; p<bytesPerPixel; p++) {
            pixelBuffer.push(buf.readInt8( p + offset ));
          }
          pixels.push(pixelBuffer);
        }
      }
      return pixels;
    };
    
    
    class PNG {
      constructor(config) {
        
        // TODO: separate out the PNG-file specific fields, and the general image info
        
        this.width = config.width;
        this.height = config.height;
        this.bitDepth = config.bitDepth;
        this.colourType = config.colourType;
        this.compressionMethod = config.compressionMethod;
        this.filterMethod = config.filterMethod;
        this.interlaceMethod = config.interlaceMethod;
        this.chunks = config.chunks;
        this.content = config.content;
        
        this.imageData = config.imageData || null;
        
        console.log(this);
      }
      
      getImageData() {
        // If we already have it, then give it away now!
        if( this.imageData ) {
          return Promise.resolve(this.imageData);
        }
        
        const compressionData = this.chunks.filter( chunk => {
          return chunk.type === 'IDAT';
        }).map( chunk => {
          return chunk.data;
        });
        
        const compressedFilteredData = Buffer.concat(compressionData, compressionData.reduce((acc, buf) => acc + buf.length, 0));
        
        return new Promise( (resolve, reject) => {
          zlib.unzip(compressedFilteredData, (err, buffer) => {
            if( err ) {
              return reject(err);
            }
            
            let method = null;
            switch( this.filterMethod ) {
            case 0:
              method = this.unFilterMethod_0;
              break;
            }
            
            if( !method ) {
              reject('Unimplemented filter method for ', this.filterMethod );
            }
            
            // Set the imageData
            this.imageData = method(buffer);
            resolve(this.imageData);
          });
        });
      }
      
      unFilterMethod_0 (oldBuffer) {
        const unfiltered = Buffer.from(oldBuffer);
        for( let i=0; i < oldBuffer.length; i++) {
          unfiltered[i] = oldBuffer[i];
        }
        return unfiltered;
      }
      
      filterMethod_0 (oldBuffer) {
        const filtered = Buffer.from(oldBuffer);
        for( let i=0; i < oldBuffer.length; i++) {
          filtered[i] = oldBuffer[i];
        }
        return filtered;
      }
      
      resize( width, height) {
        if ( typeof height === 'undefined' ) {
          height = width;
        }
        if( width !== height ) {
          return Promise.reject('Width isnt the height and im lazy. Program this yourself');
        }
        
        return this.getImageData().then( data => {
          console.log('Uncompressed data size: ', data.length);
          console.log(data);
          
          const colourChannels = 3; // assuming colourType == 2
          // TODO: do differently here for colourChannels where we dont assume
          const bytesPerPixel = this.bitDepth * colourChannels / 8;
          console.log('Bytes per pixel: ', bytesPerPixel );
          // Create a new buffer based on the new pixel number and quality of existing pixels
          const resizeBuffer = Buffer.allocUnsafe( bytesPerPixel * width * height + height );
          // Get the scale (2 if the source is twice as big as the target)
          const scale = this.width / width;
          
          // Just get a map of teh pixels without the overflow at the start of each scanline
          const pixels = [];
          for( let y = 0; y < this.height; y++ ) {
            for( let p = 1; p < data.length; p += bytesPerPixel ) {
              let pixelBuffer = Buffer.allocUnsafe(bytesPerPixel);
              let offset = y * (1 + bytesPerPixel * width );
              data.copy(pixelBuffer, );
              pixels.push();
            }
          }
          
          return this;
          /*
          for ( var y=0; y < height; y++) {
            for ( var x=0; x < width; x++) {
              const offset = (bytesPerPixel * ( width * y ) + x) + (y + 1);
              const pixelBoxOnSource = {
                topLeft: {
                  x: (scale * x),
                  y: (scale * y),
                },
                botRight: {
                  x: (scale * x) + (scale/2),
                  y: (scale * y) + (scale/2),
                },
              };
              const pixels = getPixelsFromBox(data, pixelBoxOnSource, this.width, bytesPerPixel);
              // Now average out the pixels
              // TODO: eventually weight the pixels based on how much area they cover
              // Make the average pixel colour
              console.log(x, y, pixelBoxOnSource, pixels);
              
              for(let b=0; b < bytesPerPixel; ++b) {
                const avg = pixels.reduce( (acc, channels) => ( acc + channels[b] ), 0 ) / pixels.length;
                resizeBuffer.writeInt8( avg, b + offset );
              }
            }
          }
          
          return new PNG({
            width: width,
            height: height,
            imageData: resizeBuffer,
            
            // These haven't changed
            bitDepth: this.bitDepth,
            colourType: this.colourType,
            compressionMethod: this.compressionMethod,
            filterMethod: this.filterMethod,
            interlaceMethod: this.interlaceMethod,
            
            // These dont exist yet
            chunks: [],
            content: null,
          });*/
        });
      }
      
      saveIco(filename) {
        return this.getContent().then( content => {
          if( this.width !== this.height ) {
            return reject('Image size isnt square. Im not doing this.');
          }
          
          const MAX_SIZE = 256;
          if( this.width > MAX_SIZE ) {
            return reject('Image width (' + this.width + ') too large for ico file. Maximum allowed is ', MAX_SIZE );
          }
          
          // ICONDIR structure
          const iconDir = Buffer.allocUnsafe(6);
          iconDir.writeUInt16LE(0, 0); // 0 = always 0
          iconDir.writeUInt16LE(1, 2); // 1 = ico file
          iconDir.writeUInt16LE(1, 4); // 1 = number of images
          
          // ICONDIRENTRY structure
          const iconDirEntry = Buffer.allocUnsafe(16);
          iconDirEntry.writeUInt8(this.width, 0);
          iconDirEntry.writeUInt8(this.height, 1);
          iconDirEntry.writeUInt8(0, 2); // 0 = no palletes for now
          iconDirEntry.writeUInt8(0, 3); // should be 0. because ?!?
          iconDirEntry.writeUInt16LE(0, 4); // Colour planes ..?
          iconDirEntry.writeUInt16LE(0, 6); // Bits per pixel - 0, png data
          iconDirEntry.writeUInt32LE(content.length, 8);
          iconDirEntry.writeUInt32LE(iconDir.length + iconDirEntry.length, 12);
          
          const bufferToWrite = Buffer.concat([
            iconDir, iconDirEntry, content
          ], iconDir.length + iconDirEntry.length + content.length);
          
          return new Promise( (resolve, reject) => {
            fs.writeFile(filename, bufferToWrite, (err) => {
              if( err ) {
                return reject(err);
              }
              
              return resolve(this);
            });
            
          });
        });
      }
      
      getContent() {
        if( this.content ) {
          return Promise.resolve(this.content);
        }
        
        return new Promise( (resolve, reject) => {
          // Filter image data
          let method = null;
          switch( this.filterMethod ) {
          case 0:
            method = this.filterMethod_0;
            break;
          }
          
          if( !method ) {
            reject('Unimplemented filter method for ', this.filterMethod );
          }
          
          // Set the imageData
          const filteredImagedata = method(this.imageData);
          
          // Compress image data
          zlib.deflate(filteredImagedata, (err, compressedImageData) => {
            if( err ) {
              return reject(err);
            }
          
            const headerBuffer = Buffer.from([
              0x89,
              0x50, 0x4E, 0x47, // "PNG"
              0x0D, 0x0A, // CRLF
              0x1A, // end of file character
              0x0A, // Unix line feed
            ]);
            
            const ihdrChunk = createChunk('IHDR', (() => {
              const ihdrChunkContent = Buffer.allocUnsafe(13);
              ihdrChunkContent.writeUInt32BE(this.width, 0);
              ihdrChunkContent.writeUInt32BE(this.height, 4);
              ihdrChunkContent.writeInt8(this.bitDepth, 8);
              ihdrChunkContent.writeInt8(this.colorDepth, 9);
              ihdrChunkContent.writeInt8(this.compressionMethod, 10);
              ihdrChunkContent.writeInt8(this.filterMethod, 11);
              ihdrChunkContent.writeInt8(this.interlaceMethod, 12);
              return ihdrChunkContent;
            })());
            
            const contentChunk = createChunk('IDAT', compressedImageData);
            
            const iendChunk = createChunk('IEND', Buffer.from([
              0x73, 0x69, 0x78, 0x68,
            ]));
            
        
            this.content = Buffer.concat([
              headerBuffer,
              ihdrChunk,
              contentChunk,
              iendChunk,
            ], headerBuffer.length + ihdrChunk.length + contentChunk.length + iendChunk.length );
            
            resolve(this.content);
          });
        });
      }
      
      savePng(filename) {
        return this.getContent().then( content => {
          if( !filename ) {
            return Promise.resolve(true);
          }
          
          return new Promise( (resolve, reject) => {
            fs.writeFile(filename, content, (err) => {
              if( err ) {
                return reject(err);
              }
              
              return resolve(content);
            });
          });
        });
      }
    } // end class PNG
    
    
    const load = (filename) => {
      return new Promise( (resolve, reject) => {
        fs.readFile(filename, (err, content) => {
          if( err ) {
            return reject(err);
          }
          
          const header = Buffer.allocUnsafe(8);
          content.copy( header, 0, 0, 8);
          if( header.toString('ascii', 1, 4) !== 'PNG' ) {
            throw new Error('This is not a PNG');
          }
          
          // https://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR
          const infoChunk = readChunk(8, content);
          
          const config = {
            width: infoChunk.data.readUInt32BE(0),
            height: infoChunk.data.readUInt32BE(4),
            bitDepth: infoChunk.data.readInt8(8),
            colourType: infoChunk.data.readInt8(9),
            compressionMethod: infoChunk.data.readInt8(10),
            filterMethod: infoChunk.data.readInt8(11),
            interlaceMethod: infoChunk.data.readInt8(12),
            chunks: [],
            // finally, the content of the file buffer
            content,
          };
          
          let next = infoChunk.next;
          while( next < content.length ) {
            let chunk = readChunk(next, content);
            next = chunk.next;
            config.chunks.push(chunk);
          }
          
          return resolve(new PNG(config));
        });
      });
    };
    
    const readChunk = (start, buf) => {
      //[
      //  length (4)
      //  chunk-type (4)
      //  data (length)
      //  crc (4)
      //]
      // https://en.wikipedia.org/wiki/Portable_Network_Graphics#"Chunks"_within_the_file
      const length = buf.readUInt32BE(start);
      const type = buf.toString('ascii', start + 4, start + 8);
      const crc = buf.readUInt32BE(start + 8 + length);
      
      // Get the data portion, starting after the chunk-type
      const data = Buffer.allocUnsafe( length );
      buf.copy(data, 0, start + 8, start + 8 + length);
      
      return {
        type,
        length,
        data,
        crc,
        next: start + length + 12,
      };
    }
    
    const createChunk = (type, content) => {
      //[
      //  length (4)
      //  chunk-type (4)
      //  data (length)
      //  crc (4)
      //]
      // https://en.wikipedia.org/wiki/Portable_Network_Graphics#"Chunks"_within_the_file
      const chunkBuffer = Buffer.allocUnsafe(content.length + 12);
      const crcBuffer = Buffer.allocUnsafe(content.length + 4);
      chunkBuffer.writeUInt32BE(content.length, 0); // length
      
      // We're copying only the type and the dat 
      crcBuffer.write( type, 0, 4); // type
      content.copy( crcBuffer, 4, 0 ); // data
      crcBuffer.copy(chunkBuffer, 4, 0); // copy the crcBuffer into the chunkBuffer
      
      chunkBuffer.writeUInt32BE(crc.crc32(crcBuffer), content.length + 8 );
      
      return chunkBuffer;
    }
    
    module.exports = {
      PNG,
      load,
    };
  `);
};

const newWay = (config) => {
  return createTree(config, {
    'png.js': createPngScript,
    '.gitignore': createGitIgnore,
    '.eslintrc.json': createEslintConfigFile,
    '.babelrc': createBabelRc,
    'webpack.config.js': createWebpack,
    'gulpfile.js': createGulpfile,
    'nodemon.json': createNodemonConfig,
    'package.json': createPackage,
    'README.md': createREADME,
    'client': {
      'style': {
        'app.less': createStylesheet,
        'icon.png': createAppIcon,
      },
      'src': {
        'components': {
          'core': {
            'Icon.jsx': (config) => {
              return strip(`
                export default (props) => {
                  const size = props.size || 1;
                  const colour = props.colour || '#FFF';
                  return <i className={[
                      'fa',
                      'fa-' + size.toString(),
                      'fa-' + props.icon,
                    ].join(' ')}
                    style={{
                      color: colour,
                    }}
                    aria-hidden="true">
                  </i>
                };
              `);              
            }
          },
          'Header.jsx': (config) => {
            return strip(`
              export default class Header extends React.Component {
                render() {
                  return <nav className="navbar navbar-light bg-light">
                    <a className="navbar-brand" href="#">
                      App
                    </a>
                  </nav>;
                }
              }
            `);
          },
          'Contact.jsx': (config) => {
            return strip(`
              import Icon from './core/Icon';
              
              export default class Contact extends React.Component {
                render() {
                  const ingredients = [{
                    name: 'GitHub',
                    // TODO: make this the link to the package
                    href: 'https://github.com/',
                    icon: 'github',
                  }];
                  return <div className="container">
                    <div className="row">{ingredients.map( ingredient => {
                        return <div className="col" key={ingredient.name}>
                          <a href={ingredient.href}>
                            <Icon size={3} icon={ingredient.icon}/>
                          </a>
                        </div>;
                    })}</div>
                  </div>;
                }
              }
            `);
          },
          'App.jsx': (config) => {
            return strip(`
              import Header from './Header';
              import Contact from './Contact';
              
              export class App extends React.Component {
                render() {
                  return <div id="page">
                    <Header />
                    <div className="container">
                      <div className="display-1">App</div>
                      <p className="lead">This is application that is default</p>
                    </div>
                    <Contact />
                  </div>;
                }
              }
            `);
          },
        },
        'app.js': (config) => {
          return strip(`
            import { App } from './components/App';

            ReactDOM.render(
              React.createElement(App, {
                // empty context
              }, null),
              document.getElementById('root')
            );
          `);
        },
      }
    },
    'server': {
      'views': {
        'index.html': createIndexTemplate,
      },
      'lib': {
        'logger.js': createLogger,
      },
      'app.js': createApp,
    },
  }).then( res => {
    console.log('done');
  }).catch( err => {
    console.error(err);
  });
};


newWay({
  projectName: 'proj-name',
  description: 'description for the project',
  serverFolder: 'server',
  clientFolder: 'client',
  appFileName: 'app.js',
  viewsDir: 'views',
}).then( res => {
  // PNG script is ready
  
  const png = require('./png');
  
  png.load('icon.png').then( icon => {
    icon.resize(64).then( icon => {
      //icon.saveIco('icon-2.png');
      icon.savePng('icon-2.png');
    });
  });
});