
# Create an association with Carto dataset (dynamic) and Mapbox tileset (static)
## User process:
- Configure API keys / Access token / Usernames (JEO -> Settings)
- Create a layer (see: [Creating layers](layer-post.md)): 
  - This will generate a tileset on mapbox. 
  - The generated titeset will replace current layer settings.
- User goes to mapbox editor and uses the automatically generated titleset to build the layers/map/style/interations
- Create a new layer inside plugin using the previously built layer (this layer usually is an mapbox style, not the tileset layer itself, since tileset dosen't have any styles)
- New layer can now be used inside the JEO MAPS
- WP-cron task will update all tilesets daily.

## Integrated layer creation process:
- Create new layer (JEO -> Layers -> Add new)
- Check "Use integration" box located at the right sidebar
- Add reference SQL query
- Click "Syncronize"
- Accept the risks of getting the current layer overwritten
- Wait until the process is complete and check the "Setting" tab
- The "Settings" tab gets the new generated tileset settings (you can check mapbox studio tilesets and your automated tileset should be there.
- Save

## Integration structural information:
- map_layer (post_type): 
	metas: { ...base_metas: object, use_carto_integration: bool, sql_query: string }
## Backstage Process:
- Layer post is created (see: Integrated layer creation process) - "Syncronize" calls endpoint `/wp-json/carto_integrate` (see: Endpoints specs)
	- Endpoint work:
		- Fetch GeoJSON from Carto using `sql_query` (https://carto.com/developers/sql-api/reference/#tag/Single-SQL-Statement) - **network consumption may be noticed**
		- The fetched GeoJSON is stored in memory for next step - **memory consumption may be noted during batch update**
		- Request AWS S3 credentials for stating file (https://api.mapbox.com/uploads/v1/$username/credentials?access_token=$api_key)
		- Uploud file to S3  
		- Uploud staged file to Mapbox (https://api.mapbox.com/uploads/v1/$username?access_token=$api_key):
			- the response contains the tileset properties and uploud status;
		- Endpoint responses success for step 1 
		- Front-end will keep doing periodic request to check if the uploud is done (step 2) using  https://api.mapbox.com/uploads/v1/${owner}/${id}?access_token=${jeo_private_options.mapbox_private_key}
			- Check response `complete`? and then set layer settings using the response
## Endpoint specs
- [ POST ] `/wp-json/carto_integrate`
	- headers:
		- X-WP-Nonce: worpdress nonce (string),
		- Content-Type: application/json (string)
	- body:
		- sql_query: Carto query (string)
		- If those are passed will replace mapbox tileset (recurrente update):
			- tileset: `tileset.id` or `false`, (string)
			- title: `tileset.name` or `false`, (string)
			
## Important notices:
- Server consuption mostly depends on GeoJson size.
- If the wp cron has a lot of tasks, it's important to keep in mind if those are not exeeding the server php maximum execution time. 
- Mapbox file uploud is async, but Carto SQL GeoJSON download and uploud to AWS S3 stage isn't.
- WP cron isn't like a OS cron. (https://developer.wordpress.org/plugins/cron/understanding-wp-cron-scheduling/)
- If your site don't get many hits a better way to garantee the mapbox tilesets update is using a system cron to call wp cron. (https://developer.wordpress.org/plugins/cron/hooking-wp-cron-into-the-system-task-scheduler/)
- If a sync is already made clicking at "Syncronize" button will overwrite the tileset (a new one will not be created).
