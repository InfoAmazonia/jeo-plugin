<?php
namespace Jeo;

class Importer {

	use Singleton;

	public $post_type = '_partners_sites';
    public $event = 'jeo_import_posts';

	protected function init() {
        add_filter( 'cron_schedules', [ $this, 'cron_schedules' ] );

        add_action( "save_post_{$this->post_type}", [ $this, 'schedule_cron' ], 10, 3 );

        add_action( $this->event, [ $this, 'run_cron'], 10, 1 );

        
        //add_action( 'admin_init', [ $this, 'admin_init'] );
    }
    public function admin_init() {
        do_action( $this->event, 430 );
    }
    /**
     * Add custom schedules interval
     *
     * @param array $schedules
     * @return void
     */
    public function cron_schedules($schedules){
        if(!isset($schedules[ '30min' ])){
            $schedules[ '30min' ] = [
                'interval' => 30*60,
                'display' => 'Once every 30 minutes'
            ];
        }
        return $schedules;
    }
    /**
     * Schedule cron for every single site (post) on save action
     *
     * @param int $id
     * @param WP_POST|OBJECT $site
     * @param bool $update
     * @return void
     */
    public function schedule_cron( $id, $site, $update ) {
        $args = [
            'id' => $id
        ];
        if ( ! wp_next_scheduled( $this->event, $args ) ) {
            wp_schedule_event( time(), '30min', $this->event, $args );
        } else {
            $time = wp_next_scheduled( $this->event, $args );
            wp_unschedule_event( $time, $this->event, $args );

            wp_schedule_event( time(), '30min', $this->event, $args );
        }
        // Run first import after save first time
        if ( ! $update ) {
            do_action( $this->event, $args[ 'id'] );
        }
    }
    /**
     * Undocumented function
     *
     * @param int $post_id
     * @return void
     */
    protected function upload_thumbnail( $post_id, $url ) {
        include_once( ABSPATH . 'wp-admin/includes/admin.php' );

        //echo ' imagem ' . $post_id . ' url ' . $url . ' ';

        $file = [];
        $file['name'] = $url;
        $file['tmp_name'] = download_url( $url );

        $image_id = media_handle_sideload( $file, $post_id );
        echo "/r/n/";
        var_dump( $image_id );
        echo "/r/n/";

        set_post_thumbnail( $post_id, $image_id );
    }
    /**
     * Run cron / Perfome HTTP GET to Site api and save posts
     *
     * @param array $args
     * @return void
     */
    public function run_cron( $id ) {
        global $wpdb;

        $request_params = [ 'per_page' => 100, '_embed' => true ];
        $data = get_post_meta( $id );
        if ( ! isset( $data[ "{$this->post_type}_site_url" ] ) || ! filter_var( $data[ "{$this->post_type}_site_url" ][0], FILTER_VALIDATE_URL ) ) {
            return;
        }
        $date_timestamp = get_post_timestamp( $id, 'date' );
        //echo '<br>UNIX ANTES: ' . $date_timestamp;
        if( isset( $data[ "{$this->post_type}_date" ] ) ) {
            $date_timestamp = $data[ "{$this->post_type}_date" ][0];
        }
        $iso_date = date('c', $date_timestamp );
        $request_params[ 'after'] = $iso_date;
        //echo '<br>UNIX DPS: ' . $date_timestamp;

        //echo '<br>ISODATE<pre>';
        //print_r( $iso_date );
        //echo '</pre>';
        
        if( isset( $data[ "{$this->post_type}_remote_category" ] ) ) {
            if( $data[ "{$this->post_type}_remote_category" ][0] && is_numeric( $data[ "{$this->post_type}_remote_category" ][0] ) ) {
                $request_params[ 'categories' ] = [ $data[ "{$this->post_type}_remote_category" ][0] ];
            }
        }
        $URL = $data[ "{$this->post_type}_site_url" ][0];
        if ( '/' === substr( $URL, -1) ) {
            $URL = substr( $URL, 0, -1);
        }
        $URL = $URL . '/wp-json/wp/v2/posts/?' . http_build_query( $request_params );

        $response = wp_remote_get( $URL, [] );
        //echo $response[ 'body'];

        if ( ! is_wp_error( $response ) && is_array( $response ) ) {
            $posts = json_decode( $response['body'], true );
            $category = wp_get_post_categories( $id );
            
            foreach( $posts as $post ) {
                $partner_post_id = absint( $post[ 'id' ] );
                $link = esc_textarea( $post[ 'link' ] );

                $post_exists = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = 'partner-link' AND meta_value = '{$link}'");
                if ( $post_exists ) {
                    continue;
                }

                $metadata = [
                    'partner-link'          => esc_textarea( $post[ 'link'] ),
                    'external-source-link'  => esc_textarea( $post[ 'link' ] ),
                    'partner_post_id'       => $partner_post_id,
                ];    
                $post_args = [
                    'post_title'        => $post[ 'title' ]['rendered'],
                    'post_excerpt'      => wp_strip_all_tags( $post[ 'excerpt' ]['rendered'] ),
                    'post_date'         => $post[ 'date' ],
                    'post_name'         => $post[ 'slug' ],
                    'meta_input'        => $metadata,
                    'post_category'     => $category,
                    'post_status'       => 'publish',
                    'post_type'         => 'post',
                ];
                $post_inserted = wp_insert_post( $post_args, true, true );

                if ( $post_inserted && ! is_wp_error( $post_inserted ) ) {
                    if ( isset( $post['_embedded'] ) && isset( $post['_embedded']['wp:featuredmedia'] ) ){
                        $this->upload_thumbnail( $post_inserted, $post['_embedded']['wp:featuredmedia'][0]['source_url'] );
                    }

                }

            }
        } 
    }
}
$importer = \Jeo\Importer::get_instance();