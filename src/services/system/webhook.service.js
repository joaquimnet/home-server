const express = require('express');
const log = require('consola');

const WebhookLog = require('../../models/webhook-log.model');

module.exports = {
  name: 'Webhook',

  routes: {
    'POST /system/webhook': 'webhook',
  },

  actions: {
    webhook: {
      middleware: [express.json()],
      async handler({ req, res }) {
        log.info(req.body);
        const webhooklog = new WebhookLog({
          headers: req.headers,
          body: req.body,
        });
        try {
          await webhooklog.save();
          log.info('Saved webhook message to database');
        } catch {
          /* */
        }
        res.status(201).send({ message: 'ok' });
      },
    },
  },
};
