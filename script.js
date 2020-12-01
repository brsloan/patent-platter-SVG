const client = stitch.Stitch.initializeDefaultAppClient("patentreader-ticse");
  const db = client
    .getServiceClient(stitch.RemoteMongoClient.factory, "mongodb-atlas")
    .db("Patents");  

const startingTownship = "022N - 002W";
const scale = 40;

AuthorizeAndFetchData(startingTownship);

function AuthorizeAndFetchData(twp) {
  client.auth
    .loginWithCredential(new stitch.AnonymousCredential())
    .then(() => fetchData(twp))
    .catch(err => {
    console.error(err);
  });
}

function fetchData(twp) {
  db
    .collection("wildcat_area")
    .find({ Twp_Rng: twp }, { limit: 1000 })
    .asArray()
    .then(docs => {
    platTownship(docs);
  })
    .catch(err => {
    console.error(err);
  });
}
