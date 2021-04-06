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

module.exports.getLastDay = async function (event, context){
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

module.exports.postMes = async function (event, context){
    console.log("EVENT BODY", event.body)
    const data = JSON.parse(event.body);
    console.log("PARSED");
    var iotData = new AWS.IotData({
        endpoint: "a2nkqjvyvlcr2i-ats.iot.us-east-1.amazonaws.com"
    })
    var params = {
        topic: "sekkyone_from_aws",
        payload: JSON.stringify(data),
        qos: 0
    }
    console.log(params);

    try{
        const result = await iotData.publish(params).promise();
        return success({message: "OK"});
    } catch(err) {
        console.log("ERR AWAIT", err);
        return failure({status: false})
    }
}