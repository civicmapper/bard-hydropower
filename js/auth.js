// generate a token with your client id and client secret

function getToken() {
  console.log("authorizing...");
  $.ajax({
    type: 'POST',
    url: 'https://www.arcgis.com/sharing/rest/oauth2/token/',
    data: {
      'f': 'json',
      'client_id': 'Rl33Ikhm8yr4xlz4',
      'client_secret': '6f298cc008464a718f30366ecd85e5cb',
      'grant_type': 'client_credentials',
      'expiration': '1440'
    },
    succes: runGp1
  });
}