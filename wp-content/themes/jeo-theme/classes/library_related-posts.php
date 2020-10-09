<?php
namespace guaraci;

class related_posts {

    static function init() {
        add_action( 'admin_init', 'guaraci\\related_posts::settings_api_init' );
    }

    static function settings_api_init() {
        add_settings_field(
            'related_posts__use',
            __('Posts Relacionados', 'guaraci'),
            'guaraci\\related_posts::settings',
            'reading'
        );
        
        register_setting( 'reading', 'related_posts__use' );
        register_setting( 'reading', 'related_posts__tags_weight' );
        register_setting( 'reading', 'related_posts__categories_weight' );
        register_setting( 'reading', 'related_posts__date_weight' );
    }

    static function settings() {
        ?>
        <p>
            <label>
                <input name="related_posts__use" id="related_posts__use" type="checkbox" value="1" class="code" <?= checked( 1, get_option( 'related_posts__use' ), false ) ?> /> <?php _e('Usar posts relacionados') ?>
            </label>
        </p>
        <p>
            <label>
                <?php _e('Tag weight') ?><br> 
                <input name="related_posts__tags_weight" id="related_posts__tags_weight" type="number" step="0.1" value="<?= get_option('related_posts__tags_weight', 2) ?>" class="code" />
            </label>
        </p>
        <p>
            <label>
                <?php _e('Category weight') ?><br> 
                <input name="related_posts__categories_weight" id="related_posts__categories_weight" type="number" step="0.1" value="<?= get_option('related_posts__categories_weight', 1.5) ?>" class="code" />
            </label>
        </p>
        <p>
            <label>
                <?php _e('Date weight') ?><br> 
                <input name="related_posts__date_weight" id="related_posts__date_weight" type="number" step="0.1" value="<?= get_option('related_posts__date_weight', 10) ?>" class="code" />
            </label>
        </p>
        <?php
    }


    static function get_post_taxonomy_terms($post_id, $taxonomy){
        $_terms = get_the_terms($post_id, $taxonomy) ?: [];

        $_terms = array_map(function($el) {
            return $el->term_taxonomy_id;
        }, $_terms);

        //Remove audio, video, long-form, news, image-gallery, opinion from filters
        $post_types_categories = [33, 80, 65, 34, 64, 32];
        foreach($post_types_categories as $key => $value) {  
            if (($k = array_search($value, $_terms)) !== false) {
                unset($_terms[$k]);
            }
        }

        $result = implode(',', $_terms);

        return $result ?: -1;
    }

    static function get_posts($post_id = null, $num = 3, $after = null, $before = null){
        global $wpdb;

        $post_types = implode("','", ['post']);

        if(is_null($post_id)){
            $post_id = get_the_ID();
        }

        $tags_multiplier = get_option('related_posts__tags_weight', 2);
        $categories_multiplier = get_option('related_posts__categories_weight', 1.5);
        $date_multiplier = get_option('related_posts__date_weight', 10);


        $categories = self::get_post_taxonomy_terms($post_id, 'category');
        $tags = self::get_post_taxonomy_terms($post_id, 'post_tag');

        $tags_sql = "((SELECT COUNT(t1.term_taxonomy_id) * $tags_multiplier FROM $wpdb->term_relationships t1 WHERE t1.object_id = p.ID AND t1.term_taxonomy_id IN ($tags)))";
        $cats_sql = "((SELECT COUNT(t2.term_taxonomy_id) * $categories_multiplier FROM $wpdb->term_relationships t2 WHERE t2.object_id = p.ID AND t2.term_taxonomy_id IN ($categories)))";
        $date_sql = "
        (3/(ABS(datediff(
            (SELECT post_date FROM $wpdb->posts WHERE ID = $post_id),
            p.post_date
        )) + 1))";

        $sql = "
        SELECT
            p.ID,
            (
                $tags_sql + 
                $cats_sql + 
                $date_sql * $date_multiplier
            ) AS num

        FROM $wpdb->posts p
        WHERE
            p.post_type IN ('$post_types') AND
            p.post_status = 'publish' AND
            p.ID <> $post_id
        GROUP BY p.ID
        ORDER BY num DESC, ID ASC
        LIMIT $num";

        $result = $wpdb->get_results($sql);
        // echo '<pre>';
        // echo $sql;
        // print_r($result);
        // echo '</pre>';
        $ids = array_map(function($el) { return $el->ID; }, $result);

        if(!$ids) {
            $ids = [-1];
        }

        $query = new \WP_Query([
            'post__in' => $ids,
            'post_type' => ['post'],
            'posts_per_page' => -1,
            'orderby' => 'post__in'
        ]);

        return $query;
    }

    static function get_months_before() {
        return get_option('related_posts__months_before', 6);
    }

    static function get_months_after() {
        return get_option('related_posts__months_after', 6);
    }
}

add_action('init', function(){
    related_posts::init();
});