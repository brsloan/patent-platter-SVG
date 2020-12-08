const client = stitch.Stitch.initializeDefaultAppClient("patentreader-ticse");
const db = client
  .getServiceClient(stitch.RemoteMongoClient.factory, "mongodb-atlas")
  .db("Patents");

//const startingTownship = "022N - 002W";
const startingCounty = "Clinton";
const scale = 40;

AuthorizeAndFetchData(startingCounty);

function AuthorizeAndFetchData(cnty) {
  client.auth
    .loginWithCredential(new stitch.AnonymousCredential())
    .then(() => fetchData(cnty))
    .catch(err => {
    console.error(err);
  });
}

function fetchData(cnty) {
  db
    .collection("wildcat_area")
    .find({ County: cnty }, { limit: 5000 })
    .asArray()
    .then(docs => {
      console.log(docs);
    platTownship(docs);
    //patentConverter.getElasticMatrix(docs);
  })
    .catch(err => {
    console.error(err);
  });
}

//Event Handlers, etc.
