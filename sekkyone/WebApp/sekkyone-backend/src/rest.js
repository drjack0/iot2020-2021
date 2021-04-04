const AWS = require("aws-sdk");

function call(action,params){
    const dynamoDB = new AWS.DynamoDB.DocumentClient();
    return dynamoDB[action](params).promise();
}

function success(body){
    return buildResponse(200,body);
}

function failure(body){
    return buildResponse(500,body);
}

function buildResponse(statusCode,body){
    return {
        statusCode: statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify(body)
    };
}

module.exports.getLastHour = async function (event, context){
    console.log(event);
    const lastTime = (Date.now() - 24*60*60*1000).toString();
    const params = {
        TableName: process.env.APPLICATION_TABLE,
        FilterExpression: "sensor_time > :runtimeValue",
        ExpressionAttributeValues: {
            ":runtimeValue": lastTime
        },
    };

    console.log(params);

    try{
        const result = await call("scan", params);
        console.log(result);
        return success(result);
    } catch(err) {
        console.log(err);
        return failure({status: false});
    }
}