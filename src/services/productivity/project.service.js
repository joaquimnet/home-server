const { Error } = require('mongoose');
const express = require('express');
const log = require('consola');

const Project = require('../../models/project.model');
const { ERRORS } = require('../../config');
const auth = require('../../middleware/jwt');

module.exports = {
  name: 'project',
  routes: {
    'POST /project': 'createProject',
    'GET /project': 'listProjects',
    'GET /project/:id': 'getProject',
    'PATCH /project/:id': 'updateProject',
    'DELETE /project/:id': 'deleteProject',
  },
  actions: {
    getProject: {
      middleware: [auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let project;
        try {
          project = await Project.findById(params.id).populate([
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

        if (!project) {
          return res.status(404).send(ERRORS.NOT_FOUND);
        }

        if (project.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        res.send(project.safe());
      },
    },
    listProjects: {
      middleware: [auth({ required: true })],
      params: {
        // tags: { type: 'string', optional: true },
        search: { type: 'string', optional: true },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let project;
        try {
          if (params.search) {
            project = await Project.find(
              { author: req.user._id, $text: { $search: params.search } },
              { score: { $meta: 'textScore' } },
            )
              .sort({ score: { $meta: 'textScore' } })
              .exec();
          } else {
            project = await Project.find({ author: req.user._id }).exec();
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(project.map((n) => n.safe()));
      },
    },
    createProject: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        title: {
          type: 'string',
          min: 3,
          max: 255,
        },
        specific: {
          type: 'string',
          min: 3,
        },
        measurable: {
          type: 'string',
          min: 3,
        },
        achievable: {
          type: 'string',
          min: 3,
        },
        realistic: {
          type: 'string',
          min: 3,
        },
        time: {
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
            epics: {
              type: 'array',
              items: 'string',
              default: [],
            },
          },
        },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let project;
        try {
          project = new Project({
            title: params.title,
            specific: params.specific,
            measurable: params.measurable,
            achievable: params.achievable,
            realistic: params.realistic,
            time: params.time,
            tags: params.tags,
            connections: params.connections,
            author: req.user._id,
          });

          await project.save();
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res
              .status(422)
              .send(ERRORS.CUSTOM(`You provided an invalid id`));
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(project);
      },
    },
    updateProject: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        title: {
          type: 'string',
          min: 3,
          max: 255,
          optional: true,
        },
        specific: {
          type: 'string',
          min: 3,
          optional: true,
        },
        measurable: {
          type: 'string',
          min: 3,
          optional: true,
        },
        achievable: {
          type: 'string',
          min: 3,
          optional: true,
        },
        realistic: {
          type: 'string',
          min: 3,
          optional: true,
        },
        time: {
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
            epics: {
              type: 'array',
              items: 'string',
              default: [],
            },
          },
        },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let project;
        try {
          project = await Project.findById(params.id);
          if (!project) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (project.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        if (params.title) project.title = params.title;
        if (params.specific) project.specific = params.specific;
        if (params.measurable) project.measurable = params.measurable;
        if (params.achievable) project.achievable = params.achievable;
        if (params.realistic) project.realistic = params.realistic;
        if (params.time) project.time = params.time;
        if (params.tags) project.tags = params.tags;
        if (params.connections) project.connections = params.connections;

        try {
          await project.save();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.send(project);
      },
    },
    deleteProject: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let project;
        try {
          project = await Project.findById(params.id);
          if (!project) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (project.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        try {
          await Project.findByIdAndDelete(project._id).exec();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.status(204).end();
      },
    },
  },
  methods: {
    // async getProject(id) {
    //   return await Note.findById(id);
    // },
  },
};
