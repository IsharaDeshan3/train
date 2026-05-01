const {
  kafkaProducer,
  kafkaEnabled,
  isKafkaProducerConnected,
} = require('../config/kafka');

const topicForEntity = {
  train: process.env.KAFKA_TRAIN_TOPIC || 'train.events',
  station: process.env.KAFKA_STATION_TOPIC || 'station.events',
  route: process.env.KAFKA_ROUTE_TOPIC || 'route.events',
  schedule: process.env.KAFKA_SCHEDULE_TOPIC || 'schedule.events',
};

const publishDomainEvent = async (entity, action, payload) => {
  if (!kafkaEnabled() || !isKafkaProducerConnected()) {
    return;
  }

  const topic = topicForEntity[entity];
  if (!topic) {
    throw new Error(`No Kafka topic configured for entity: ${entity}`);
  }

  const event = {
    eventType: `${entity}.${action}`,
    entity,
    action,
    eventVersion: 1,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  const key = payload?.id?.toString() || payload?._id?.toString() || undefined;

  await kafkaProducer.send({
    topic,
    messages: [
      {
        key,
        value: JSON.stringify(event),
      },
    ],
  });
};

module.exports = {
  publishDomainEvent,
};
