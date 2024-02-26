class apiResponse{
    constructor(statusCode, data , message = "Success"){
        this.statusCode= statusCode;
        this.data = data
        this.message = message;
        this.success = statusCode<400 ;  // if the http request is successful it will be true

    }
}

export {apiResponse}