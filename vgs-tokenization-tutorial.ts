import * as VGS from './vgs/aliasesApi';

console.log(process.env.VAULT_API_USERNAME);
console.log(process.env.VAULT_API_PASSWORD);

// Defining the host is optional and defaults to https://api.sandbox.verygoodvault.com.
// For production use https://api.live.verygoodvault.com
const config = VGS.config(
  process.env.VAULT_API_USERNAME,
  process.env.VAULT_API_PASSWORD,
  'https://tntmqx4h14u.sandbox.verygoodproxy.com',
);

// in this example we are storing three tokens within your VGS vault using a single API call
// this will return three tokens which can be stored in your system and used individually or together
// through any VGS Vault product including our Zero Data platform.
//
// the aliases namespace allows you to directly store, manage, and
// retrieve tokens from your vgs vault.
//
// in the below example we demonstrate how to store payment card and personally identifiable
// information in a single API call.

const api = new VGS.Aliases(config);

(async () => {
  // first, let's create a request payload to tokenize our sensitive data.
  const data = [
    // credit card
    {
      // format is used to determine how the stored token is represented
      // see https://www.verygoodsecurity.com/docs/terminology/nomenclature#alias-formats
      // to learn about different formats and representations available
      // to tokenize secured data.
      format: 'PFPT',
      value: '4111111111111111',
      // see https://www.verygoodsecurity.com/docs/vault/concepts#classifiers
      // to learn how to classify and tag your data to help secure access and
      // route data compliantly.
      classifiers: ['credit-card', 'number'],
      storage: 'PERSISTENT',
    },
    // card security code
    {
      format: 'UUID',
      value: '123',
      classifiers: ['credit-card', 'csc'],
      // learn how volatile storage allows you to maintain full pci compliance
      // https://www.verygoodsecurity.com/docs/terminology/nomenclature#storage
      storage: 'VOLATILE',
    },
    // social security number
    {
      format: 'UUID',
      value: '078-05-1120',
      classifiers: ['pii', 'ssn'],
    },
  ];
  console.log('Tokenizing multiple values...');

  const aliases = await api.redact(data);

  console.log(`Tokens created\n${JSON.stringify(aliases, null, 2)}`);

  // example of how to find the alias associated to each value
  aliases.forEach((i) => console.log(i.aliases[0].alias));

  // next, let's update the classifiers and re-alias
  const firstAlias = aliases[0].aliases[0].alias;

  await api.update(firstAlias, { classifiers: ['bank-account', 'test-tag'] });

  console.log(`Token ${firstAlias} updated`);

  // now let's retrieve it back
  const revealed = await api.reveal(firstAlias);

  console.log(`Token ${firstAlias} retrieved\n${JSON.stringify(revealed, null, 2)}`);

  // finally, let's delete an alias
  await api.delete(firstAlias);

  console.log(`Token ${firstAlias} deleted`);

  // now let's fetch it back to ensure it's not usable.
  console.log(`Trying to retrieve deleted token ${firstAlias}...`);
  try {
    await api.reveal(firstAlias);
  } catch (error) {
    console.log(`We can no longer fetch the token, it has been deleted: ${error}`);
  }
})();
