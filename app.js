
var http = require('http'),
    jwt  = require('jwt-simple'),
    querystring = require('querystring'),
    argv = require('optimist')
           .usage('Usage: $0 -col [article id] -title [title] -net [network] -site [site id] -secret [site secret] -url [url base] -tags [tags] -type [type] -lib [true/false] -save [true/false]')
           .demand(['title','net','site','secret','url','col'])
           .alias('title','t')
           .describe('title','livefyre collection title')
           .alias('net','n')
           .describe('net','livefyre network, ex: labs-t402.fyre.co')
           .alias('site','s')
           .describe('site','livefyre site id, ex: 303827')
           .alias('secret','k')
           .describe('secret','livefyre site secret, ex: [user token]')
           .alias('url','u')
           .describe('url','url base, ex: http://demos.livefyre.com/labs-t402/')
           .alias('save','e')
           .describe('save','create(true) test(false)')
           .alias('col','c')
           .describe('col','livefyre article/collection id')
           .alias('tags','g')
           .describe('tags','comma separated list of tags')
           .alias('type','y')
           .describe('type','type of collection to create')
           .alias('lib','l')
           .describe('lib','run via cli if not true')
           .argv;

var __NETWORK, __SITE_ID, __SITE_SECRET, __SITE_SECRET, __URL_BASE, __SAVE;


    
if(!argv.lib){
	__NETWORK = argv.net; //'labs-t402.fyre.co',
	__SITE_ID = argv.site; //303827,
	__SITE_SECRET = argv.secret; //'/=',
	__URL_BASE = argv.url; //'http://demos.livefyre.com/labs-t402/',
	__SAVE = (argv.save == 'f' || argv.save == 'false' || argv.save == false ) ? false : true; //true
	if( __NETWORK
	    && __SITE_ID
	    && __SITE_SECRET
	    && __URL_BASE
	    && argv.col
	    && argv.title){
	
	    var collection_data = {
	        articleId: argv.col,
	        title: argv.title
	    };
	    
	    if(argv.type){
	    	collection_data.type = argv.type;
	    }
	    if(argv.tags){
	    	collection_data.tags = argv.tags;
	    }
	    
	    // console.log(JSON.stringify(collection_data))
	
	    create_collection(collection_data);
	}
	else{
	    console.log("missing data");
	}
}

function collection_meta_jwt(site_secret, article_id, title, url, tags, type){
    // Create JSON Obj
    data = {
        articleId: article_id,
        title: title,
        url: url
    };
    if (tags){
        data['tags'] = tags;
    }
    if (type){
        data['type'] = type;
    }

    return jwt.encode(data, site_secret);
}


function create_collections(infos){
    for(x in infos){
        var info = infos[x];
        create_collection(info);
    }
}

function create_collection(info, convCallback){
	var _siteId = __SITE_ID || info["siteId"],
		_network = __NETWORK || info["network"],
		_site_secret = __SITE_SECRET || info["secret"],
		_url = (__URL_BASE) ? __URL_BASE + info['articleId'] : info["url"];
    var post_data = {
            article_id : info['articleId'],
            title: info['title'],
            url: _url,
            collectionMeta : collection_meta_jwt(_site_secret, info['articleId'], info['title'], _url, info["tags"], info["type"])
        };
    var post_data_string = JSON.stringify(post_data);
    var http = require('http');
    var post_options = {
              host: "quill."+_network,
              path: "/api/v3.0/site/"+_siteId+"/collection/create",
              port: '80',
            method: 'POST',
            headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': post_data_string.length
            }
        };

    if( __SAVE !== false && info["save"] !== false ){
        callback = function(response) {
            var str = '';

            response.setEncoding('utf-8');

            response.on('data', function (chunk) {
            str += chunk;
            });

            response.on('end', function () {
            console.log(str);
            convCallback(str);
            });
        };

        var req = http.request(post_options, callback);
        req.write(JSON.stringify(post_data));
        req.end();
    }
    else{
    	var _msg = "Creating Collection for article_id="+post_data.article_id+", title="+post_data.title+", url="+post_data.url;
        console.log( _msg );
        convCallback( post_data );
    }
}

module.exports = create_collection;
exports.collection_meta_jwt = collection_meta_jwt;
