const { Storage } = require('@google-cloud/storage');
const mime = require('mime-types');
const multer = require('multer');
const { ulid } = require('ulid');
const got = require('got');
const path = require('path');
const fs = require('fs');
const log = require('consola');

const {
  ERRORS,
  GOOGLE_PROJECT_ID,
  GOOGLE_BUCKET_KEY,
  GOOGLE_BUCKET_NAME,
} = require('../../config');
const Image = require('../../models/image.model');
const auth = require('../../middleware/jwt');

const GOOGLE_BUCKET_KEY_FILENAME = 'bucketeer.json';

fs.writeFileSync(
  path.resolve(__dirname, GOOGLE_BUCKET_KEY_FILENAME),
  GOOGLE_BUCKET_KEY,
  'utf-8',
);

module.exports = {
  name: 'Resources',

  routes: {
    'POST /resources/image': 'uploadImage',
    'POST /resources/image-url': 'uploadImageByUrl',
  },

  actions: {
    uploadImage: {
      middleware: [auth({ required: true }), multer().single('file')],
      async handler({ params, req, res, next }) {
        // do stuff
        const storage = new Storage({
          projectId: GOOGLE_PROJECT_ID,
          keyFilename: path.resolve(
            __dirname,
            './' + GOOGLE_BUCKET_KEY_FILENAME,
          ),
        });
        const bucket = storage.bucket(GOOGLE_BUCKET_NAME);

        let tags = [];
        if (Array.isArray(params.tags)) {
          tags = params.tags;
        } else if (typeof params.tags === 'string') {
          tags = params.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        }

        if (!tags.length) tags = ['untagged'];

        const type = mime.lookup(req.file.originalname);
        const generatedUlid = ulid();
        const objectPath = `home/${generatedUlid}.${mime.extensions[type][0]}`;

        const image = new Image({
          filename: req.file.originalname,
          blob: objectPath,
          mime: type,
          ulid: generatedUlid,
          tags,
        });

        const blob = bucket.file(objectPath);

        const stream = blob.createWriteStream({
          resumable: true,
          contentType: type,
        });

        stream.on('error', (err) => {
          log.error(err);
          res.status(500).send(ERRORS.GENERIC);
        });

        stream.on('finish', () => {
          image
            .save()
            .then(() => {
              res.status(201).json({
                success: 1,
                file: {
                  url: `http://img.assets.work/${blob.name}`,
                },
              });
            })
            .catch((err) => {
              log.error(err);
              res.status(500).send(ERRORS.GENERIC);
            });
        });

        stream.end(req.file.buffer);
      },
    },
    uploadImageByUrl: {
      middleware: [auth({ required: true }), multer().single('file')],
      async handler({ params, res }) {
        const { url } = params;

        let headers;
        try {
          headers = (await got.head(url)).headers;
        } catch (err) {
          log.error(err);
          if (err.statusCode >= 400 && err.statusCode <= 499) {
            return res.status(500).send({
              success: 0,
              message: 'Invalid image',
            });
          }
          return res.status(500).send(ERRORS.GENERIC);
        }

        const storage = new Storage({
          projectId: GOOGLE_PROJECT_ID,
          keyFilename: path.resolve(
            __dirname,
            './' + GOOGLE_BUCKET_KEY_FILENAME,
          ),
        });
        const bucket = storage.bucket(GOOGLE_BUCKET_NAME);

        let tags = [];
        if (Array.isArray(params.tags)) {
          tags = params.tags;
        } else if (typeof params.tags === 'string') {
          tags = params.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        }

        if (!tags.length) tags = ['untagged'];

        const type = headers['content-type'];
        const generatedUlid = ulid();
        const objectPath = `home/${generatedUlid}.${mime.extensions[type][0]}`;

        const image = new Image({
          filename: path.basename(url),
          blob: objectPath,
          mime: type,
          ulid: generatedUlid,
          tags,
        });

        const blob = bucket.file(objectPath);

        const stream = blob.createWriteStream({
          resumable: true,
          contentType: type,
        });

        stream.on('error', (err) => {
          log.error(err);
          res.status(500).send(ERRORS.GENERIC);
        });

        stream.on('finish', () => {
          image
            .save()
            .then(() => {
              res.status(201).json({
                success: 1,
                file: {
                  url: `http://img.assets.work/${blob.name}`,
                },
              });
            })
            .catch((err) => {
              log.error(err);
              res.status(500).send(ERRORS.GENERIC);
            });
        });

        got.stream(url).pipe(stream);
        // stream.end(img.body);
      },
    },
  },
};
