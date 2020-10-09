<?php
    $isRepublishablePost = get_post_meta(get_the_ID(), 'republish_post', true);

    global $wp_registered_widgets;
    $widgets = wp_get_sidebars_widgets(); 
    $content = null;
    
    $my_postid = get_the_ID();//This is page id or post id
    $content_post = get_post($my_postid);
    $content = $content_post->post_content;
    $content = apply_filters('the_content', $content);
    $content = str_replace(']]>', ']]&gt;', $content);

    $bullet_widget = array_key_exists('republish_modal_bullets', $widgets)? $widgets['republish_modal_bullets'] : null;
    $bullets = [];

	if($bullet_widget) {
		$bullet_widget = $bullet_widget[0];
        $bullets = $wp_registered_widgets[$bullet_widget]['callback'][0]->get_settings();
        
    }
?>
<?php if($isRepublishablePost): ?>
    <div class="republish-post">
        <div class="republish-post-label-wrapper">
            <div class="republish-post-label">
                <i class="fas fa-sync-alt icon"></i>
                <p class="text"><?php esc_html_e('REPUBLISH THIS CONTENT'); ?></p>
            </div>
        </div>
        <div class="modal-container">
            <div class="republish-post-modal shadow">
                <div class="main-modal">
                    <button class="close-button">
                        <i class="fa fa-times-circle" aria-hidden="true"></i>
                    </button>
                    <div>
                        <div class="content main">
                            <p class="title"><?php echo get_theme_mod('republish_modal_title', __('Republish'))?></p>
                            <p class="introduction"><?= get_theme_mod('republish_modal_introduction', '') ?></p>
                            <p class="bullets-introduction"><?= get_theme_mod('republish_modal_bullets_introduction', '') ?></p>

                            <ul>
                                <?php foreach($bullets as $bullet): ?>
                                    <?php if(get_post_meta(get_the_ID(), str_replace(' ', '_', $bullet['title']), true)): ?>
                                        <li class="bullet-description"><?php echo $bullet['description'] ?></li>
                                    <?php endif ?>
                                <?php endforeach ?>
                            </ul> 
                            <div>
                                <div class="controls">
                                        <button class="html-button">HTML</button>
                                        <button class="text-button"><?php _e('Text') ?></button>
                                </div>
                            </div>
                            <div class="copied-content">
                                <div class="content">
                                    <div class="wrapper wrapper-html-text">
                                        <p class="raw-text"><?php echo htmlspecialchars($content) ?></p>
                                    </div>
                                    <div class="wrapper wrapper-raw-text">
                                        <p class="html-text"><?php echo wp_strip_all_tags( get_the_content() ); ?></p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button class="copy-button"><?php _e('Copy'); ?></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
<?php endif ?>