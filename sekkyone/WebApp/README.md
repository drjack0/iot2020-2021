# Web App Dashboard
This folder is related to the dashboard responsible of visualizing retrieved data.

This Application is entirely made in Javascript and Html, with Bootstrap and React Framework.

## Backend Logic
On the backend side, we have an API Gateway and all the paths of this endpoint invoke some Lambda functions.
There are two types of path:
- **REST**: For retrieving data already stored in the DynamoDB. This call is characterized by the path <code>GET /lastDay</code> for getting all the last day's measurements.
- **WEBSOCKET**:  For Real time communication beetween AWS and Frontend. We havve <code>$connect</code> and <code>$disconnect</code> functions (that store in a DynamoDB table informations about devices) and a <code>getData</code> function for retrieving real time data from DynamoDB Stream

All the code is provided to AWS by [**Serverless Framework**](https://www.serverless.com/), a special npm package that allows us to write, test and deploy code to aws simply with the creation of a CloudFormation stack, with inside all the stuffs significant to our application logic.

## Frontend
Frontend is full written in **Javascript**, precisely with **React Framework**, and the main template is designed by [Creative Tim](https://www.creative-tim.com/). The (Rest) API Gateway endpoint are called with *axios* library in asynchronous way.

The website is hosted in a **S3 bucket** with a *hosting configuration*
