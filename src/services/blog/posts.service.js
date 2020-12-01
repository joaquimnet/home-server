const express = require('express');
const { Error } = require('mongoose');
const log = require('consola');
const slugify = require('slugify');
const { randomBytes } = require('crypto');

const { ERRORS } = require('../../config');
const auth = require('../../middleware/jwt');
const Post = require('../../models/post.model');

module.exports = {
  name: 'posts',
  routes: {
    'GET /posts': 'getPosts',
    'GET /posts/:slug': 'getPost',
    'POST /posts/:slug/like': 'likePost',
    'POST /posts': 'createPost',
    'PATCH /posts/:id': 'editPost',
    'PUT /posts/:id': 'editPost',
    'DELETE /posts/:id': 'deletePost',
  },
  actions: {
    getPosts: {
      params: {
        limit: { type: 'number', convert: true, default: 10, optional: true },
        offset: { type: 'number', convert: true, default: 0, optional: true },
        $$strict: true,
      },
      async handler(req, res) {
        const params = { ...req.params, ...req.query, ...req.body };

        let posts;
        try {
          posts = await this.getAllPosts(params);
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }
        res.send(posts);
      },
    },
    getPost: {
      params: {
        slug: 'string',
        $$strict: true,
      },
      async handler(req, res) {
        const params = { ...req.params, ...req.query, ...req.body };

        let post;
        try {
          post = await this.getPostBySlug(params.slug);
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (!post) {
          return res.status(404).send(ERRORS.NOT_FOUND);
        }

        try {
          await Post.updateOne({ _id: post._id }, { $inc: { 'meta.views': 1 } }).exec();
        } catch {}

        post.meta.views += 1;
        res.send(post);
      },
    },
    likePost: {
      params: {
        slug: 'string',
        $$strict: true,
      },
      async handler(req, res) {
        const params = { ...req.params, ...req.query, ...req.body };

        let result;
        try {
          // post = await this.getPostBySlug(params.slug);
          result = await Post.updateOne(
            { slug: params.slug },
            { $inc: { 'meta.likes': 1 } },
          ).exec();
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (!result.n) {
          return res.status(404).send(ERRORS.NOT_FOUND);
        }
        res.send({ message: 'Post liked successfully' });
      },
    },
    createPost: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        title: { type: 'string', min: 3, max: 128 },
        content: { type: 'string', min: 3 },
        description: { type: 'string', min: 3, max: 280 },
        tags: { type: 'array', items: 'string', optional: true },
        $$strict: true,
      },
      async handler(req, res) {
        const params = { ...req.params, ...req.query, ...req.body };

        const slug = this.createSlug(params.title);

        let post;
        try {
          post = new Post({
            title: params.title,
            content: params.content,
            description: params.description,
            tags: params.tags,
            author: req.user._id,
            slug,
          });

          await post.save();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        return res.status(201).send(post);
      },
    },
    deletePost: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler(req, res) {
        const params = { ...req.params, ...req.query, ...req.body };

        let post;
        try {
          post = await this.getPostById(params.id);
          if (!post) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (post.author.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        try {
          await Post.findByIdAndDelete(post._id).exec();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.status(204).end();
      },
    },
    editPost: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        title: { type: 'string', min: 3, max: 128, optional: true },
        content: { type: 'string', min: 3, optional: true },
        description: { type: 'string', min: 3, max: 280, optional: true },
        tags: { type: 'array', items: 'string', optional: true, optional: true },
        $$strict: true,
      },
      async handler(req, res) {
        const params = { ...req.params, ...req.query, ...req.body };

        let post;
        try {
          post = await this.getPostById(params.id);
          if (!post) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (post.author.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        if (params.title) {
          post.title = params.title;
          post.slug = this.createSlug(params.title);
        }
        if (params.content) post.content = params.content;
        if (params.description) post.description = params.description;
        if (params.tags) post.tags = params.tags;

        try {
          await post.save();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(post);
      },
    },
  },
  methods: {
    getAllPosts({ limit, offset }) {
      return Post.find({}).limit(Number(limit)).skip(Number(offset)).exec();
    },
    getPostById(id) {
      return Post.findById(id).exec();
    },
    getPostBySlug(slug) {
      return Post.findOne({ slug }).populate('author', ['_id', 'username', 'email']).exec()
    },
    createSlug(str) {
      const random = '-' + randomBytes(4).toString('hex');

      const slug =
        slugify(str, {
          replacement: '-', // replace spaces with replacement character, defaults to `-`
          remove: undefined, // remove characters that match regex, defaults to `undefined`
          lower: true, // convert to lower case, defaults to `false`
          strict: true, // strip special characters except replacement, defaults to `false`
          locale: 'en', // language code of the locale to use
        }).substr(0, 247) + random;

      return slug;
    },
  },
};
