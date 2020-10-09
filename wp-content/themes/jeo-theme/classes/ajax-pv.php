<?php
class PageViews {
    /**
     *
     * @var wpdb
     */
    static $wpdb;

    static $post_types = [];

    static function init() {
        self::activation();
        global $wpdb;

        self::$wpdb = $wpdb;
        
        add_action('wp_enqueue_scripts', [__CLASS__, 'scripts']);
        add_action('wp_ajax_nopriv_ajaxpv', [__CLASS__, 'action']);
        add_action('wp_loaded', [__CLASS__, 'set_post_types']);

        self::db_updates();
    }

    static function scripts() {
        if(!is_user_logged_in() && (is_single() || is_home() || is_front_page())){  
            wp_localize_script('main-app', 'ajaxurl', admin_url('admin-ajax.php'));

            wp_localize_script('main-app', 'ajaxpv', base_convert(get_the_ID(), 10, 36));

            $post_type_hash = self::post_type_hash(is_front_page() ? 'frontpage' : get_post_type());

            wp_localize_script('main-app', 'ajaxpt', $post_type_hash);
        }
    }

    static function activation() {
        // https://codex.wordpress.org/Creating_Tables_with_Plugins
        global $wpdb;
        $table_name = $wpdb->prefix . "pageviews";

        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table_name (
          id bigint NOT NULL AUTO_INCREMENT,
          time datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
          post_type varchar(20) NOT NULL,
          post_id bigint(20) unsigned NOT NULL,
          PRIMARY KEY (id)
        ) $charset_collate;";

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
        dbDelta($sql);
    }

    static function post_type_hash($post_type){
        return md5(__METHOD__ . $post_type);
    }

    static function set_post_types(){
        $post_types = get_post_types();
        $post_types['frontpage'] = 'frontpage';
        foreach($post_types as $post_type){
            $hash = self::post_type_hash($post_type);
            self::$post_types[$hash] = $post_type;
        }
    }

    static function action() {
        if (isset($_POST['ajaxpv']) && isset($_POST['ajaxpt'])) {
            $post_id = base_convert($_POST['ajaxpv'], 36, 10);
            $post_type = isset(self::$post_types[$_POST['ajaxpt']]) ? self::$post_types[$_POST['ajaxpt']] : null;

            if ($post_type && self::get_post_id_from_referer() == $post_id) {
                self::add_pageview($post_id, $post_type);
            }
        }
    }

    static function add_pageview($post_id, $post_type) {
        $table_name = self::$wpdb->prefix . "pageviews";

        self::$wpdb->insert($table_name, ['post_id' => $post_id, 'post_type' => $post_type]);
    }

    static function get_post_id_from_referer() {
        if (isset($_SERVER['HTTP_REFERER'])) {
            return url_to_postid($_SERVER['HTTP_REFERER']);
        }
    }

    static function get_top_viewed($num = 10, $args = []){
        $args += [
            'post_type' => 'post',
            'to' => null
        ];

        $cache_key = md5(__METHOD__ . json_encode($args));
        
        if($result = wp_cache_get($cache_key, __CLASS__)){
            return $result;
        }

        $table_name = self::$wpdb->prefix . "pageviews";

        $where = [];
        if($args['post_type']){
            if(!is_array($args['post_type'])){
                $args['post_type'] = [$args['post_type']];
            }
            
            $args['post_type'] = array_map(function($item) { return "'$item'"; }, $args['post_type']);
            $args['post_type'] = implode(",", $args['post_type']);
        
            $where[] = "post_type IN ({$args['post_type']})";
        }

        if($args['from']){
            $where[] = "time >= '{$args['from']}'";
        }

        if($args['to']){
            $where[] = "time <= '{$args['to']}'";
        }

        $where = implode(' AND ', $where);

        if($where){
            $where = "WHERE $where";
        }
        
        $limit = '';
        if($num != -1){
            $limit = "LIMIT {$num}";
        } 

        $sql = "
            SELECT 
                COUNT(id) AS num, 
                post_id 

            FROM {$table_name} 

            {$where} 
            
            GROUP BY post_id 
            ORDER BY num DESC 
            $limit";

        $ids = self::$wpdb->get_results($sql);

        wp_cache_add($cache_key, $ids, __CLASS__, 15 * MINUTE_IN_SECONDS);
        
        return $ids;
    }

    static function db_updates(){
        if(!defined( 'DOING_CRON' )){
            return false;
        }
        $wpdb = self::$wpdb;

        $table_name = $wpdb->prefix . "pageviews";

        $updates = [
            'id to bigint' => function() use($wpdb, $table_name) {
                $wpdb->query("ALTER TABLE $table_name MODIFY id BIGINT UNSIGNED AUTO_INCREMENT;");
            }
        ];

        foreach($updates as $key => $fn){
            $option_name = __METHOD__ . ':' . $key;
            if(!get_option($option_name)){
                $fn();
                add_option($option_name, true);
            }
        }
    }
}

add_action('init', function(){
    PageViews::init();
});
