const Crawler = require('crawler');
const cheerio = require('cheerio');
const signale = require('signale');
const utils = require('./utils');
const MongoClient = require('mongodb').MongoClient;


const initialPoints = [{ lat: -90, lon: -180 }, { lat: 90, lon: 180 }]
const url = 'mongodb://admin:admin@localhost:27017';
let ids = new Set();
async function init() {
    const client = await MongoClient.connect(url,{ useNewUrlParser: true })
    signale.success('Mongo connected!')
    let db = client.db('cian');
    let collection = db.collection('rent_offers_ids');
    let checkCollection = db.collection('rent_offers_data');
    await collection.drop(() => signale.success('Old collection was deleted.'))
    let crawler = new Crawler({
        maxConnections: 32,
        retries: 3,
        retryTimeout: 2000,
        jQuery: false,
        callback: async function (error, res, done) {
            let self = this;
            let data;
            let BreakException = {};
            let point;

            if (res.statusCode == 200) {
                data = JSON.parse(res.body);
                if (data.status == 'toomuch') {
                    try {
                        Object.keys(data.data.points).forEach((element, item, array) => {
                            let lat, lon;
                            [lat, lon] = element.split(' ');
                            if (Number(lat).between(self.points[0].lat, self.points[1].lat) && Number(lon).between(self.points[0].lon, self.points[1].lon)) {
                                throw BreakException;
                            }
                        });
                    } catch (e) {
                        if (e !== BreakException) throw e;
                        //signale.debug('New area split')
                        split(self.points);
                        done();
                        return null;
                    }
                } else {
                    if (data.offerCount != 0) {
                        for (let point in data.data.points) {

                            for (let offer of data.data.points[point].offers) {
                                offer.id = parseInt(offer.id);
                                offer.price_rur = parseInt(offer.price_rur);
                                let refDoc = await checkCollection
                                                    .findOne({
                                                        'offer.cianId':offer.id,
                                                        'offer.bargainTerms.price':offer.price_rur
                                                    });
                                if (refDoc) {
                                    refDoc.lastSeen = new Date();
                                    if (refDoc.offer.bargainTerms.prices.rur!=offer.price_rur) {
                                        await checkCollection.deleteOne({ '_id' : refDoc._id});
                                        refDoc = null;
                                    } else {
                                        await checkCollection.save(refDoc);
                                    }
                                }
                                
                                if (!ids.has(offer.id) && !refDoc) {
                                    [offer.lat, offer.lon] = point.split(' ');
                                    ids.add(offer.id);
                                    await collection.insertOne(offer);
                                }
                            }

                        }
                    }
                }

            } else {

            }

            done();
        }
    });
    crawler.queue({ url: buildSearchURL(initialPoints), points: initialPoints, userAgent: ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWe'] });

    crawler.on('drain', () => {
        signale.complete('Ids fetching compleat. We are ready to update database.')
        process.exit(0);
    })

    function split(points) {
        center_lat = points[0].lat + (points[1].lat - points[0].lat) / 2;
        center_lon = points[0].lon + (points[1].lon - points[0].lon) / 2;
        let newAreas = [
            [
                { lat: points[0].lat, lon: points[0].lon },
                { lat: center_lat, lon: center_lon }
            ],
            [
                { lat: center_lat, lon: points[0].lon },
                { lat: points[1].lat, lon: center_lon }
            ],
            [
                { lat: center_lat, lon: center_lon },
                { lat: points[1].lat, lon: points[1].lon }
            ],
            [
                { lat: points[0].lat, lon: center_lon },
                { lat: center_lat, lon: points[1].lon }
            ]
        ];
    
        newAreas.forEach((element, item, array) => {
            crawler.queue({ url: buildSearchURL(element), points: element, userAgent: ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWe'] });
        });
    }
}



Number.prototype.between = function (a, b) {
    let min = Math.min.apply(Math, [a, b]),
        max = Math.max.apply(Math, [a, b]);
    return this >= min && this <= max;
};

function buildSearchURL(points) {
    area = [
        points[0].lat.toFixed(6) + '_' + points[0].lon.toFixed(6),
        points[0].lat.toFixed(6) + '_' + points[1].lon.toFixed(6),
        points[1].lat.toFixed(6) + '_' + points[1].lon.toFixed(6),
        points[1].lat.toFixed(6) + '_' + points[0].lon.toFixed(6)
    ];
    return 'https://map.cian.ru/ajax/map/roundabout/?deal_type=rent&engine_version=2&in_polygon[0]=' + area.join(',');
}



init();