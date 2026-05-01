require('dotenv').config();
const { Kafka, logLevel } = require('kafkajs');

const brokers = (
  process.env.KAFKA_BROKERS || 
  process.env.UPSTASH_KAFKA_BOOTSTRAP_SERVERS || 
  'localhost:9092'
)
  .split(',')
  .map((broker) => broker.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'train-management-service',
  brokers,
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD
    ? {
        mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
      }
    : undefined,
  logLevel: process.env.NODE_ENV === 'development' ? logLevel.INFO : logLevel.ERROR,
});

const kafkaProducer = kafka.producer();
let isProducerConnected = false;

const connectKafka = async () => {
  try {
    await kafkaProducer.connect();
    isProducerConnected = true;
    console.log('✅ Kafka producer connected');
  } catch (err) {
    isProducerConnected = false;
    console.error('Failed to connect Kafka producer:', err.message);
  }
};

const disconnectKafka = async () => {
  if (!isProducerConnected) return;
  await kafkaProducer.disconnect();
  isProducerConnected = false;
};

const kafkaEnabled = () => process.env.KAFKA_ENABLED !== 'false';

module.exports = {
  kafka,
  kafkaProducer,
  connectKafka,
  disconnectKafka,
  kafkaEnabled,
  isKafkaProducerConnected: () => isProducerConnected,
};
