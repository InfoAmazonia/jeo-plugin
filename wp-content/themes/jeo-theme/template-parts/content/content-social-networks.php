<?php
    global $post;

    $authors = [];
    if (function_exists('get_coauthors')) {
        $authors = get_coauthors();
    }

    $author_count = count($authors);
    $twitter_nicknames_text = ', by ';

    $i = 1;
    if (get_post_meta(get_the_ID(), 'authors-listing', true)) :
        foreach ($authors as $author) {

            $i++;
            if ($author_count === $i) :
                /* translators: separates last two author names; needs a space on either side. */
                $sep = esc_html__(' and ', 'newspack');
            elseif ($author_count > $i) :
                /* translators: separates all but the last two author names; needs a space at the end. */
                $sep = esc_html__(', ', 'newspack');
            else :
                $sep = '';
            endif;

            if (esc_attr(get_the_author_meta('twitter', $author->ID))) {
                $twitter_nicknames_text .= '@' . esc_attr(get_the_author_meta('twitter', $author->ID)) . $sep;
            } else {
                $twitter_nicknames_text .=  get_the_author_meta('display_name', $author->ID) . $sep;
            }
        }
    else :
        $twitter_nicknames_text = '';
    endif;

    $urlTweetShare = urldecode(get_the_title() . ' ' . get_the_permalink() . $twitter_nicknames_text);
?>
<div class="page--share">
    <?php if(get_theme_mod('twitter_sharing', false)): ?>
        <div class="twitter">
            <a href="https://twitter.com/intent/tweet?text=<?= $urlTweetShare ?>" target="_blank"><i class="fab fa-twitter"></i></a>
        </div>
    <?php endif ?>
    <?php if(get_theme_mod('facebook_sharing', false)): ?>
        <div class="facebook">
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?= get_the_permalink() ?>" target="_blank"><i class="fab fa-facebook-f"></i></a>
        </div>
    <?php endif ?>
    <?php if(get_theme_mod('mail_sharing', false)): ?>
        <div class="mail">
            <a href="mailto:?subject=<?= the_title() ?>&body=<?= get_the_permalink() ?>" target="_blank"><i class="far fa-envelope"></i></a>
        </div>
    <?php endif ?>
    <?php if(get_theme_mod('whatsapp_sharing', false)): ?>
        <div class="whatsapp">
            <a href="https://api.whatsapp.com/send?text=<?= get_the_permalink() ?>" target="_blank"><i class="fab fa-whatsapp"></i></a>
        </div>
    <?php endif ?>
    <?php if(get_theme_mod('wechat_sharing', false)): ?>
        <div class="wechat">
            <a href="weixin://dl/moments" target="_blank"><i class="fab fa-weixin"></i></a>
        </div>
    <?php endif ?>
    <?php if(get_theme_mod('line_sharing', false)): ?>
        <div class="line">
            <a href="https://line.me/R/msg/text/?<?= get_the_permalink() ?>" target="_blank"><i class="fab fa-line"></i></a>
        </div>
    <?php endif ?>
</div>