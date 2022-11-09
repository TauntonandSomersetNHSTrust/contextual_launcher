## Somerset Foundation NHS Trust - Contextual Launcher - v1.0
Until user authentication improves across the board, we needed a way for users to click a link in one software suite (in this case [The Better Platform](http://better.care/)) and be redirected to another (SiDER) without needing to re-login, or re-search for whichever patient they were currently examining in the initial.

This service acts as a proxy, accepting requests from a dedicated, fully formed link, in the Better platform, validates the request with the embedded access_token (for both time and correct claims path value), obfuscates any patient data, then autonomously logs into SiDER, and redirects the request there with the new access_token, and obfuscated data.

### Notes
This is currently in development and deployed in our dev environment. You will need to consult the .env.template file and change all parameters to suit your own systems.

Though this service only interacts between 2 different systems, the intent is that it may be needed in other situations. Variable names bespoke to SiDER (for example) may appear in what are generically named functions to save changing those variable names later. In the future a more multifacated solution will change how they are used.
### Config

Please consult the .env.template file for instructions and information of variables required. Some are already filled in, as they need not be specific to environments. You will need to create an .env.development or an .env.production from the template. Do not commit your .env files to any external repository.

## Build and Run

    npm i

### Running Locally 

    npm run dev
### Running on development server
	pm2 start ecosystem.config.js 
### Running on production server
	pm2 start ecosystem.config.js --env production	
 
## Postman/Insomnia testing
Should you wish to test the launch without a valid access_token, you can change the following variables in the .env file:

	apiKeys=[UUID KEY HERE]
	xAPIKeyEnabled=true

And copy this curl command into Postman/Insomnia

    curl --request GET \
	  --url 'http://localhost:8084/launch?patient=https%3A%2F%2Ffhir.nhs.uk%2FId%2Fnhs-number%7C[NHS NO HERE]&birthdate=[YYYY-MM-DD HERE]&practitioner=https%3A%2F%2Fsider.nhs.uk%2Fauth%7C[YOUREMAILADDRESS HERE]&location=https%3A%2F%2Ffhir.nhs.uk%2FId%2Fods-organization-code%7CRH5' \
	  --header 'x-api-key: [UUID KEY AS ABOVE]'
	  
To try a request using an access token as the platform does, you can do so with:

	curl --request GET \
	  --url 'http://localhost:8084/launch?patient=https%3A%2F%2Ffhir.nhs.uk%2FId%2Fnhs-number%7C[NHS NO HERE]&birthdate=[YYYY-MM-DD HERE]&practitioner=https%3A%2F%2Fsider.nhs.uk%2Fauth%7C[YOUREMAILADDRESS HERE]&location=https%3A%2F%2Ffhir.nhs.uk%2FId%2Fods-organization-code%7CRH5&token=[Access Token Here]' \

Note that changes to the .env files are usually not watched, so you will need to restart the service for changes to take effect. In the case of pm2, delete and start are most efficient ways.

The use of the API key access should be disabled for production.

## References
[Authoritative information on the Context Launch protocol can be found here (github.com)](https://github.com/Somerset-SIDeR-Programme/SIDeR-interop-patterns/wiki/contextual-launch)

[Information on query string obfuscation can be found here (github.com)](https://github.com/Somerset-SIDeR-Programme/SIDeR-interop-patterns/wiki/query-string-obfuscation) 

[Here is BlackPear's implementation of the obfuscation which this project cheekily uses and packages without modification (github.com)](https://github.com/BlackPearSw/obfuscated-querystring)
