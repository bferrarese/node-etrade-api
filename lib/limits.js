exports.getRequestLimits = function(module)
{
    //
    // From the etrade dev portal at
    // https://us.etrade.com/ctnt/dev-portal/getDetail?contentUri=V0_Documentation-AccountsAPI-GetAccountBalance
    //
    // accountId   path    required    Numeric account ID
    var actionDescriptor = {
            method : "GET",
            module : "statuses",
            action : "limits",
            useJSON: true,
    };

    var params = {module:module,oauth_consumer_key:this.configuration.key,oauth_token:this.configuration.oath.access_token};

    return this._run(actionDescriptor,params);
};
