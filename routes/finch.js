const express = require("express")
const axios = require('axios')
const router = express.Router()
router.use(logger)


router.get("/connect", (req, res) => {
    console.log("redirecting...")
    res.redirect("https://connect.tryfinch.com/authorize?&client_id=3cc9a4ea-db51-4b14-b772-d8f728a98164&redirect_uri=http://localhost:3000/finch/auth/token&products=directory%20individual    &sandbox=true")
})

router
  .route("/auth/token")
  .get(async (req, res) => {

    let token_request_url = 'https://api.tryfinch.com/auth/token'

    let token = '';

    await axios.post(token_request_url, {
        client_id: '3cc9a4ea-db51-4b14-b772-d8f728a98164',
        client_secret: 'finch-secret-sandbox-5NPnmMCYrfl_gkSHA82D4wSi_lP6B-jv6lScfft5',
        code: req.query.code,
        redirect_uri: 'http://localhost:3000/finch/auth/token'
      })
      .then(function (response) {
        token = response.data.access_token;
        console.log(token);
      })
      .catch(function (error) {
        console.log(error);
        res.send(error);
      })
      .finally(function () {
        
      });

    // res.send(token);
    let map_uri = ("http://localhost:3000/finch/map/render?token=").concat(token)
    res.redirect(map_uri)
  })

router
    .route("/map/render")
    .get(async (req, res) => {
        
        console.log(req.query.token)

        let count = 0

        let individuals_ids = []

        await axios.get('https://api.tryfinch.com/employer/directory', 
                        {
                            headers: { 
                                'Authorization': ('Bearer ').concat(req.query.token) ,
                                'Finch-API-Version': '2020-09-17' 
                            }
                        })
          .then(function (response) {
            count = response.data['paging']['count'];
            for (let i = 0; i < count; i++) {
                individuals_ids.push(response.data['individuals'][i]['id'])   
            }
          })
          .catch(function (error) {
            console.log(error);
          })
          .finally(function () {
            
          });


        var jsonData = { "requests": [] };
        individuals_ids.forEach(function(individual, i) 
                                {
                                    jsonData['requests'][i] = { 'individual_id': individual };
                                });

        let address_data = []
        let city_data = []
        let name_data = []
        

        await axios.post('https://api.tryfinch.com/employer/individual', jsonData,
                        {
                            headers: { 
                                'Authorization': ('Bearer ').concat(req.query.token) ,
                                'Finch-API-Version': '2020-09-17' 
                            }
                        })
            .then(function (response) {
                response.data['responses'].forEach(function(individual, i) 
                                            {
                                                address_data.push(individual['body']['residence']['line1']);
                                                city_data.push(individual['body']['residence']['city']);
                                                name_data.push(individual['body']['first_name']);
                                            });
                                            
            })
            .catch(function (error) {
                console.log(error);
            })
            .finally(function () {
            
            });

            let coordinates = []

            let mapboxQueryUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
            let mapboxToken = '.json?access_token=pk.eyJ1IjoibHNhbWJ1eWZpbmNoIiwiYSI6ImNsYndxbzBsMDBvazIzcG1yb3JqMWlvYjkifQ.vF3RfSYc2XkXG-CgRXvOJA'

            Promise.all(address_data.map(u => axios.get(mapboxQueryUrl.concat(u, mapboxToken))))
                   .then(function (result) {
                        result.forEach(function(coord, i) {
                            coordinates.push(coord.data['features'][0]['geometry']['coordinates'])
                        });
                        res.render("users/map", { empCount: coordinates , cityNames: city_data , empNames: name_data })
                   }, console.error)
})

function logger(req, res, next) {
  console.log(req.originalUrl)
  next()
}

module.exports = router