
exports.getRequestToken = function()
{
    //
    // From the etrade dev portal at
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AuthorizationAPI-GetRequestToken
    //
    // oauth_consumer_key   string  The value used by the consumer to identify itself to the service provider.
    // oauth_timestamp  integer     The date and time of the request, in epoch time. Must be accurate within five minutes.
    // oauth_nonce  string  A nonce, as described in the authorization guide - roughly, an arbitrary or random value that cannot be used again with the same timestamp.
    // oauth_signature_method   string  The signature method used by the consumer to sign the request. The only supported value is "HMAC-SHA1".
    // oauth_signature  string  Signature generated with the shared secret and token secret using the specified oauth_signature_method, as described in OAuth documentation.
    // oauth_callback   string  Callback information, as described elsewhere. Must always be set to "oob", whether using a callback or not.
    //

    var method = "GET";
    var ts = new Date();
    var module = "oauth";
    var action = "request_token";
    var useJSON = false;           // For some reason, JSON is not supported here?

    var requestOptions = this._getRequestOptions(method,ts,module,action,useJSON);

    // Add this call's query parameters
    requestOptions.qs.oauth_callback = "oob";

    // Sign the request
    var oauth_signature = this.oauth_sign.hmacsign(requestOptions.method,requestOptions.url,
                                              requestOptions.qs,this.configuration.secret);
    // Add the signature to the request
    requestOptions.qs.oauth_signature = oauth_signature;

    // Make the request
    //console.log("Request: " + requestOptions.url);
    return new Promise((resolve, reject)=>{

    this.request(requestOptions,function(error,message,body)
    {
        if (error)
        {
            console.error("Error received in etrade::getRequestToken(): " + error);
            reject(error);
        }
        else
        {
            var response = this._parseBody(message.headers["content-type"],body);

            this.configuration.oauth.request_token = response.oauth_token;
            this.configuration.oauth.request_token_secret = response.oauth_token_secret;

            // https://us.etrade.com/e/t/etws/authorize?key={oauth_consumer_key}&token={oauth_token}
            var url = "https://us.etrade.com/e/t/etws/authorize?" +
                       this.querystring.stringify({key:this.configuration.key, token:response.oauth_token});

            resolve(url);
        }
    }.bind(this));
  });
};

exports.getAccessToken = function(verificationCode)
{
    if (verificationCode.length == 0)
        return Promise.reject("Verification Code cannot be empty");

    //
    // From the etrade dev portal at
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AuthorizationAPI-GetAccessToken
    // oauth_consumer_key   string  Required    The value used by the consumer to identify itself to the service provider.
    // oauth_timestamp  integer Required    The date and time of the request, in epoch time. Must be accurate to within five minutes.
    // oauth_nonce  string  Required    A nonce, as described in the authorization guide - roughly, an arbitrary or random value that cannot be used again with the same timestamp.
    // oauth_signature_method   string  Required    The signature method used by the consumer to sign the request. The only supported value is "HMAC-SHA1".
    // oauth_signature  string  Required    Signature generated with the shared secret and token secret using the specified oauth_signature_method, as described in OAuth documentation.
    // oauth_token  string  Required    The consumer’s request token to be exchanged for an access token.
    // oauth_verifier   string  Required    The code received by the user to authenticate with the third-party application.
    //

    var method = "GET";
    var ts = new Date();
    var module = "oauth";
    var action = "access_token";
    var useJSON = false;           // For some reason, JSON is not supported here?

    var requestOptions = this._getRequestOptions(method,ts,module,action,useJSON);

    // Add this call's query parameters
    requestOptions.qs.oauth_token = this.configuration.oauth.request_token;
    requestOptions.qs.oauth_verifier = verificationCode;

    // Sign the request
    var oauth_signature = this.oauth_sign.hmacsign(requestOptions.method,requestOptions.url,
                                              requestOptions.qs,
                                              this.configuration.secret,
                                              this.configuration.oauth.request_token_secret);

    // Add the signature to the request
    requestOptions.qs.oauth_signature = oauth_signature;

    // Make the request
    //console.log("Request: " + requestOptions.url);
    return new Promise((resolve, reject)=>{
    this.request(requestOptions,function(error,message,body)
    {
        if (error)
        {
            reject(error);
        }
        else
        {
            var response = this._parseBody(message.headers["content-type"],body);

            this.configuration.oauth.access_token = response.oauth_token;
            this.configuration.oauth.access_token_secret = response.oauth_token_secret;
            this.authorized = true;
            resolve([response.oauth_token,response.oauth_token_secret]);
        }
    }.bind(this));
    });
};

exports.renewAccessToken = function()
{
    //
    // From the etrade dev portal at
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AuthorizationAPI-RenewAccessToken
    // oauth_consumer_key  string  Required    The value used by the consumer to identify itself to the service provider.
    // oauth_timestamp     integer     Required    The date and time of the request, in epoch time. Must be accurate within five minutes.
    // oauth_nonce     string  Required    A nonce, as described in the authorization guide - roughly, an arbitrary or random value that cannot be used again with the same timestamp.
    // oauth_signature_method  string  Required    The signature method used by the consumer to sign the request. The only supported value is "HMAC-SHA1".
    // oauth_signature     string  Required    Signature generated with the shared secret and token secret using the specified oauth_signature_method, as described in OAuth documentation.
    // oauth_token     string  Required    The consumer's request [Access???] token to be exchanged for an access token.

    var method = "GET";
    var ts = new Date();
    var module = "oauth";
    var action = "renew_access_token";
    var useJSON = false;           // For some reason, JSON is not supported here?

    var requestOptions = this._getRequestOptions(method,ts,module,action,useJSON);

    // Add this call's query parameters
    requestOptions.qs.oauth_token = this.configuration.oauth.access_token;

    // Sign the request
    var oauth_signature = this.oauth_sign.hmacsign(requestOptions.method,requestOptions.url,
                                              requestOptions.qs,
                                              this.configuration.secret,
                                              this.configuration.oauth.access_token_secret);

    // Add the signature to the request
    requestOptions.qs.oauth_signature = oauth_signature;

    // Make the request
    //console.log("Request: " + requestOptions.url);
    return new Promise((resolve, reject)=>{

    this.request(requestOptions,function(error,message,body)
    {
        if (error)
        {
            reject(error);
        }
        else
        {
            //var response = this._parseBody(message.headers["content-type"],body);
            resolve();
        }
    }.bind(this));
  });
};

exports.revokeAccessToken = function()
{
    //
    // From the etrade dev portal at
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AuthorizationAPI-RevokeAccessToken
    // oauth_consumer_key  string  Required    The value used by the consumer to identify itself to the service provider.
    // oauth_timestamp     integer     Required    The date and time of the request, in epoch time. Must be accurate within five minutes.
    // oauth_nonce     string  Required    A nonce, as described in the authorization guide - roughly, an arbitrary or random value that cannot be used again with the same timestamp.
    // oauth_signature_method  string  Required    The signature method used by the consumer to sign the request. The only supported value is "HMAC-SHA1".
    // oauth_signature     string  Required    Signature generated with the shared secret and token secret using the specified oauth_signature_method, as described in OAuth documentation.
    // oauth_token     string  Required    The consumer’s access token to be revoked.

    var method = "GET";
    var ts = new Date();
    var module = "oauth";
    var action = "revoke_access_token";
    var useJSON = false;           // For some reason, JSON is not supported here?

    var requestOptions = this._getRequestOptions(method,ts,module,action,useJSON);

    // Add this call's query parameters
    requestOptions.qs.oauth_token = this.configuration.oauth.access_token;

    // Sign the request
    var oauth_signature = this.oauth_sign.hmacsign(requestOptions.method,requestOptions.url,
                                              requestOptions.qs,
                                              this.configuration.secret,
                                              this.configuration.oauth.access_token_secret);

    // Add the signature to the request
    requestOptions.qs.oauth_signature = oauth_signature;

    // Make the request
    //console.log("Request: " + requestOptions.url);
    return new Promise((resolve, reject)=>{

    this.request(requestOptions,function(error,message,body)
    {
        if (error)
        {
            reject(error);
        }
        else
        {
            //var response = this._parseBody(message.headers["content-type"],body);
            this.authorized = false;
            resolve();
        }
    }.bind(this));
  });
};
