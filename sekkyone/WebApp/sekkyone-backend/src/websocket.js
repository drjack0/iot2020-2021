const ApiGatewayManagementApi = require('aws-sdk/clients/apigatewaymanagementapi');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const converter = require("aws-sdk").DynamoDB.Converter;

module.exports.connect = async function(event,context,callback){
    const db = new DynamoDB.DocumentClient();
    var putParams = {
        TableName: "WebsocketManager", // In our case, "WebSocketManager"
        Item: {
            connectionID: event.requestContext.connectionId,
        }
    };

    try {
    // Insert incoming connection id in the WebSocket
        await db.put(putParams).promise();
        return {
            statusCode: 200,
            body: "Connected"
        };
    } catch (e) {
        console.error('error!', e);
        return {
            statusCode: 501,
            body: "Failed to connect: " + JSON.stringify(e),
        };
    }
};

module.exports.disconnect = async function(event, context, callback){
    const db = new DynamoDB.DocumentClient();
    var deleteParams = {
        TableName: "WebsocketManager", // In our case, "WebSocketManager"
        Key: {
            connectionID: event.requestContext.connectionId,
        }
    };

    try {
    // If the client dis
        await db.delete(deleteParams).promise();
        return {
            statusCode: 200,
            body: "Disconnected"
        }
    } catch (e) {
        console.error('error!', e);
        return {
            statusCode: 501,
            body: "Failed to disconnect: " + JSON.stringify(e),
        };
    }
}

module.exports.trigger = async function(event, context, callback){
    const db = new DynamoDB.DocumentClient();
    let connections;
    let data = converter.unmarshall(event.Records[0].dynamodb.NewImage);
  
    try {
        connections = await db.scan({ TableName: "WebsocketManager", ProjectionExpression: 'connectionID' }).promise();
    } catch (e) {
        return { 
            statusCode: 500, 
            body: e.stack };
    }

    const api = new ApiGatewayManagementApi({
        endpoint: "https://qwd3tq7x8l.execute-api.us-east-1.amazonaws.com/dev",
    });

    const postCalls = connections.Items.map(async ({ connectionID }) => {
        await api.postToConnection({
            ConnectionId: connectionID,
            Data: JSON.stringify(data)
        }).promise();
        console.log("CONNECTION ID: "+connectionID);
        console.log("DATA PASSED: "+JSON.stringify(data));
    });

    try {
        await Promise.all(postCalls);
    } catch (e) {
        return { statusCode: 500, body: e.stack };
    }

    return {
        statusCode: 200,
        body: 'Event sent.'
    };
}