const { Error } = require('mongoose');
const express = require('express');
const log = require('consola');

const Epic = require('../../models/epic.model');
const { ERRORS } = require('../../config');
const auth = require('../../middleware/jwt');

module.exports = {
  name: 'epic',
  routes: {
    'POST /epic': 'createEpic',
    'GET /epic': 'listEpics',
    'GET /epic/:id': 'getEpic',
    'PATCH /epic/:id': 'updateEpic',
    'DELETE /epic/:id': 'deleteEpic',
  },
  actions: {
    getEpic: {
      middleware: [auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let epic;
        try {
          epic = await Epic.findById(params.id);
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (!epic) {
          return res.status(404).send(ERRORS.NOT_FOUND);
        }

        if (epic.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        res.send(epic.safe());
      },
    },
    listEpics: {
      middleware: [auth({ required: true })],
      params: {
        // tags: { type: 'string', optional: true },
        search: { type: 'string', optional: true },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let epic;
        try {
          if (params.search) {
            epic = await Epic.find(
              { author: req.user._id, $text: { $search: params.search } },
              { score: { $meta: 'textScore' } },
            )
              .sort({ score: { $meta: 'textScore' } })
              .exec();
          } else {
            epic = await Epic.find({ author: req.user._id }).exec();
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(epic.map((n) => n.safe()));
      },
    },
    createEpic: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        title: {
          type: 'string',
          min: 3,
          max: 255,
        },
        description: {
          type: 'string',
          min: 3,
        },
        tags: {
          type: 'array',
          items: 'string',
          optional: true,
        },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let epic;
        try {
          epic = new Epic({
            title: params.title,
            description: params.description,
            tags: params.tags,
            author: req.user._id,
          });

          await epic.save();
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res
              .status(422)
              .send(ERRORS.CUSTOM(`You provided an invalid id`));
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(epic);
      },
    },
    updateEpic: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        title: {
          type: 'string',
          min: 3,
          max: 255,
          optional: true,
        },
        description: {
          type: 'string',
          min: 3,
          optional: true,
        },
        tags: {
          type: 'array',
          items: 'string',
          optional: true,
        },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let epic;
        try {
          epic = await Epic.findById(params.id);
          if (!epic) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (epic.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        if (params.title) epic.title = params.title;
        if (params.description) epic.description = params.description;
        if (params.tags) epic.tags = params.tags;

        try {
          await epic.save();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(epic);
      },
    },
    deleteEpic: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let epic;
        try {
          epic = await Epic.findById(params.id);
          if (!epic) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (epic.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        try {
          await Epic.findByIdAndDelete(epic._id).exec();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.status(204).end();
      },
    },
  },
  methods: {
    // async getEpic(id) {
    //   return await Note.findById(id);
    // },
  },
};
