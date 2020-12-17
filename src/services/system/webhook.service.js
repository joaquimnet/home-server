const express = require('express');
const log = require('consola');
const { EventWebhook, EventWebhookHeader } = require('@sendgrid/eventwebhook');

const WebhookLog = require('../../models/webhook-log.model');
const { SENDGRID_SIGN_KEY, ERRORS } = require('../../config');

module.exports = {
  name: 'Webhook',

  routes: {
    'POST /system/webhook': 'webhook',
  },

  actions: {
    webhook: {
      middleware: [express.text({ type: 'application/json' })],
      async handler({ req, res }) {
        const textBody = req.body;
        const jsonBody = JSON.parse(textBody);

        log.info(jsonBody);

        const key = SENDGRID_SIGN_KEY;

        const signature = req.get(EventWebhookHeader.SIGNATURE());
        const timestamp = req.get(EventWebhookHeader.TIMESTAMP());

        if (!this.verifyRequest(key, textBody, signature, timestamp)) {
          return res
            .status(403)
            .send(ERRORS.CUSTOM('Invalid Sendgrid signature'));
        }

        const webhooklog = new WebhookLog({
          headers: req.headers,
          body: jsonBody,
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

  methods: {
    verifyRequest(publicKey, payload, signature, timestamp) {
      try {
        const eventWebhook = new EventWebhook();
        const ecPublicKey = eventWebhook.convertPublicKeyToECDSA(publicKey);
        return eventWebhook.verifySignature(
          ecPublicKey,
          payload,
          signature,
          timestamp,
        );
      } catch (err) {
        log.error(err);
        return false;
      }
    },
  },
};
