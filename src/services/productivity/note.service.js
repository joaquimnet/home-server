const { Error } = require('mongoose');
const express = require('express');
const log = require('consola');

const Note = require('../../models/note.model');
const { ERRORS } = require('../../config');
const auth = require('../../middleware/jwt');

module.exports = {
  name: 'note',
  routes: {
    'POST /note': 'createNote',
    'GET /note': 'listNotes',
    'GET /note/:id': 'getNote',
    'PATCH /note/:id': 'updateNote',
    'DELETE /note/:id': 'deleteNote',
  },
  actions: {
    getNote: {
      middleware: [auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let note;
        try {
          note = await Note.findById(params.id).populate([
            'connections.notes',
            'connections.todos',
            'connections.projects',
          ]);
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (!note) {
          return res.status(404).send(ERRORS.NOT_FOUND);
        }

        if (note.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        res.send(note.safe());
      },
    },
    listNotes: {
      middleware: [auth({ required: true })],
      params: {
        // tags: { type: 'string', optional: true },
        search: { type: 'string', optional: true },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let note;
        try {
          if (params.search) {
            note = await Note.find(
              { author: req.user._id, $text: { $search: params.search } },
              { score: { $meta: 'textScore' } },
            )
              .sort({ score: { $meta: 'textScore' } })
              .exec();
          } else {
            note = await Note.find({ author: req.user._id }).exec();
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(note.map((n) => n.safe()));
      },
    },
    createNote: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        title: {
          type: 'string',
          min: 3,
          max: 255,
        },
        content: {
          type: 'string',
          min: 3,
        },
        tags: {
          type: 'array',
          items: 'string',
          optional: true,
        },
        connections: {
          type: 'object',
          props: {
            projects: {
              type: 'array',
              items: 'string',
              default: [],
            },
            notes: {
              type: 'array',
              items: 'string',
              default: [],
            },
            todos: {
              type: 'array',
              items: 'string',
              default: [],
            },
          },
        },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let note;
        try {
          note = new Note({
            title: params.title,
            content: params.content,
            tags: params.tags,
            connections: params.connections,
            author: req.user._id,
          });

          await note.save();
        } catch (err) {
          if (err instanceof Error.CastError) {
            log.error('!!!!!!!!!!!err: ', err);
            return res
              .status(422)
              .send(ERRORS.CUSTOM(`You provided an invalid id`));
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(note);
      },
    },
    updateNote: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        title: {
          type: 'string',
          min: 3,
          max: 255,
          optional: true,
        },
        content: {
          type: 'string',
          min: 3,
          optional: true,
        },
        tags: {
          type: 'array',
          items: 'string',
          optional: true,
        },
        connections: {
          type: 'object',
          optional: true,
          props: {
            projects: {
              type: 'array',
              items: 'string',
              default: [],
            },
            notes: {
              type: 'array',
              items: 'string',
              default: [],
            },
            todos: {
              type: 'array',
              items: 'string',
              default: [],
            },
          },
        },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let note;
        try {
          note = await Note.findById(params.id);
          if (!note) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (note.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        if (params.title) note.title = params.title;
        if (params.content) note.content = params.content;
        if (params.tags) note.tags = params.tags;
        if (params.connections) note.connections = params.connections;

        try {
          await note.save();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(note);
      },
    },
    deleteNote: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let note;
        try {
          note = await Note.findById(params.id);
          if (!note) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (note.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        try {
          await Note.findByIdAndDelete(note._id).exec();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.status(204).end();
      },
    },
  },
  methods: {
    // async getNote(id) {
    //   return await Note.findById(id);
    // },
  },
};
