<?php



class API {
    /**
     * Dumps error
     *
     * @param array $message error message. default "Message not suplied"
     * @return array
     */
    private static function dump_error($message = "Message not suplied") {
        return ['error' => $message];
    }

    static function get_external_title($params) {
        $external_link = $params['target_link'];

        $cached_result = get_transient(md5($external_link));
        //var_dump($cached_result);

        if($cached_result) {
            return $cached_result;
        }

        $args = array(
            'posts_per_page'   => 1,
            'orderby'          => 'post_date',
            'order'            => 'DESC',
            'post_status'      => 'publish',
            'meta_query' => array(
                array(
                    'key'     => 'external-source-link',
                    'value'   => array( $external_link ),
                    'compare' => 'IN',
                ),
            ),
        );

        $found_posts = get_posts( $args );

        if(sizeof($found_posts)) {
            $found_post = $found_posts[0];
            $title_meta = get_post_meta( $found_post->ID, 'external-title', true);
            set_transient(md5($external_link), $title_meta, 5 * MINUTE_IN_SECONDS);

            return $title_meta;
        } else {
            return 'External source';
        }
        
        
        
    }

    static function construct_endpoints() {
        add_action( 'rest_api_init', function () {
            register_rest_route( 'api', '/external-link', array(
                'methods' => 'GET',
                'callback' => 'API::get_external_title',
                'permission_callback' => function() {
                    return true;
                },
                'args' => [
                    'target_link' => array(
                        'required' => true,
                    ),
                ],
            ) );
        } );
    }

}

API::construct_endpoints();