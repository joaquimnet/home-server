const { Error } = require('mongoose');
const express = require('express');
const log = require('consola');

const Todo = require('../../models/todo.model');
const { ERRORS } = require('../../config');
const auth = require('../../middleware/jwt');

module.exports = {
  name: 'todo',
  routes: {
    'POST /todo': 'createTodo',
    'GET /todo': 'listTodos',
    'GET /todo/:id': 'getTodo',
    'PATCH /todo/:id': 'updateTodo',
    'DELETE /todo/:id': 'deleteTodo',
  },
  actions: {
    getTodo: {
      middleware: [auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let todo;
        try {
          todo = await Todo.findById(params.id).populate([
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

        if (!todo) {
          return res.status(404).send(ERRORS.NOT_FOUND);
        }

        if (todo.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        res.send(todo.safe());
      },
    },
    listTodos: {
      middleware: [auth({ required: true })],
      params: {
        // tags: { type: 'string', optional: true },
        search: { type: 'string', optional: true },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let todo;
        try {
          if (params.search) {
            todo = await Todo.find(
              { author: req.user._id, $text: { $search: params.search } },
              { score: { $meta: 'textScore' } },
            )
              .sort({ score: { $meta: 'textScore' } })
              .exec();
          } else {
            todo = await Todo.find({ author: req.user._id }).exec();
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(todo.map((n) => n.safe()));
      },
    },
    createTodo: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        title: {
          type: 'string',
          min: 3,
          max: 255,
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            props: {
              content: {
                type: 'string',
                min: 3,
                max: 255,
              },
              done: {
                type: 'boolean',
                default: false,
              },
              createdAt: {
                type: 'date',
                default: () => new Date(),
              },
            },
          },
        },
        tags: {
          type: 'array',
          items: 'string',
          default: [],
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
        let todo;
        try {
          todo = new Todo({
            title: params.title,
            items: params.items,
            tags: params.tags,
            connections: params.connections,
            author: req.user._id,
          });

          await todo.save();
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res
              .status(422)
              .send(ERRORS.CUSTOM(`You provided an invalid id`));
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(todo);
      },
    },
    updateTodo: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        title: {
          type: 'string',
          min: 3,
          max: 255,
          optional: true,
        },
        items: {
          optional: true,

          type: 'array',
          items: {
            type: 'object',
            props: {
              content: {
                type: 'string',
                min: 3,
                max: 255,
              },
              done: {
                type: 'boolean',
                default: false,
              },
              createdAt: {
                type: 'date',
                default: () => new Date(),
              },
            },
          },
        },
        tags: {
          type: 'array',
          items: 'string',
          default: [],
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
        let todo;
        try {
          todo = await Todo.findById(params.id);
          if (!todo) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (todo.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        if (params.title) todo.title = params.title;
        if (params.items) todo.items = params.items;
        if (params.tags) todo.tags = params.tags;
        if (params.connections) todo.connections = params.connections;

        try {
          await todo.save();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(todo);
      },
    },
    deleteTodo: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let todo;
        try {
          todo = await Todo.findById(params.id);
          if (!todo) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (todo.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        try {
          await Todo.findByIdAndDelete(todo._id).exec();
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
