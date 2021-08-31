import express from 'express';
import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient(`mongodb://localhost:27017`);

const app = express();
app.use(express.json());

app.get('/api/team-list', async (req, res) => {
	const database = mongoClient.db('scouting');
	const collection = database.collection('form');
    const teams = await collection.aggregate([
        {
          // grouping the results by team number
          '$group': {
            '_id': '$team_number', 
            'avgUpperAuto': {
              '$avg': '$auto_upper_scored_balls'
            }, 
            'positionControl': {
              '$avg': {
                '$convert': {
                  'input': '$position_control', 
                  'to': 'int'
                }
              }
            }
          }
        }, 
        {
          // adds the teamNumber field
          '$addFields': {
            'teamNumber': '$_id'
          }
        }, 
        {
          // sorts in ascending order by teamNumber
          '$sort': {
            'teamNumber': 1
          }
        }, 
        {
          // joining the team based on the teamNumber
          '$lookup': {
            'from': 'team', 
            'localField': 'teamNumber', 
            'foreignField': 'team_number', 
            'as': 'team'
          }
        }, 
        {
          // merging the team object with the returned document
          '$replaceRoot': {
            'newRoot': {
              '$mergeObjects': [
                {
                  '$arrayElemAt': [
                    '$team', 0
                  ]
                }, '$$ROOT'
              ]
            }
          }
        }, 
        {
          // removing the _id and team fields
          '$project': {
            '_id': 0, 
            'team': 0
          }
        }
      ]).toArray();
      res.json(teams);
});

app.listen(8080, async () => {
	await mongoClient.connect();
	console.log('Express with typescript http://localhost:8080');
});
