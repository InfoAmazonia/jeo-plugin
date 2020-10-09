import "./font-size";

window.addEventListener("DOMContentLoaded", function () {
    jQuery(window).scroll(function () {
        var headerHeight = document.querySelector(
            ".bottom-header-contain.desktop-only"
        ).offsetTop;
        // console.log(headerHeight);
        if (jQuery(this).scrollTop() > headerHeight) {
            jQuery(".bottom-header-contain.post-header").addClass("active");

            if (!jQuery("header #header-search").hasClass("fixed")) {
                jQuery("header #header-search").addClass("fixed");
                jQuery("header #header-search").css("top", 0 + "px");
                jQuery("header #header-search").css("padding-top", 50 + "px");
                jQuery("header #header-search").css(
                    "height",
                    jQuery(window).height()
                );
            }
        } else {
            if (!jQuery("body").hasClass("mobile-menu-opened")) {
                jQuery(".bottom-header-contain.post-header").removeClass("active");
            }

            if (jQuery("header #header-search").hasClass("fixed")) {
                jQuery("header #header-search").removeClass("fixed");
                jQuery("header #header-search").css(
                    "top",
                    document.querySelector(".bottom-header-contain.desktop-only")
                        .offsetTop +
                    45 +
                    "px"
                );
            }
        }
    });

    jQuery("button.search-toggle").click(function (e) {
        jQuery("header#masthead").toggleClass("hide-header-search");
    });

    jQuery("header #header-search").css(
        "top",
        document.querySelector(".bottom-header-contain.desktop-only").offsetTop +
        50 +
        "px"
    );


    jQuery("header #header-search").css(
        "height",
        jQuery(window).height() -
        document.querySelector(".bottom-header-contain.desktop-only").offsetTop +
        "px"
    );

    document
        .getElementById("mobile-sidebar-fallback")
        .style.setProperty(
            "--padding-left",
            jQuery(
                ".bottom-header-contain.post-header .mobile-menu-toggle.left-menu-toggle"
            ).offset().left + "px"
        );

    jQuery(".more-menu--content").css(
        "left",
        jQuery("aside#mobile-sidebar-fallback").offset().left +
        jQuery("aside#mobile-sidebar-fallback").width() +
        jQuery(
            ".bottom-header-contain.post-header .mobile-menu-toggle.left-menu-toggle"
        ).offset().left
    );

    jQuery("button.mobile-menu-toggle").click(function () {
        jQuery(".more-menu--content").css(
            "left",
            jQuery("aside#mobile-sidebar-fallback").width()
        );
    });

    jQuery('button[action="toggle-options"]').click(function () {
        jQuery(this.parentNode.querySelector(".toggle-options")).toggleClass('active');
    });

    document.addEventListener('click', function(event) {
        var isClickInsideElement = document.querySelector('button[action="toggle-options"]').contains(event.target);
        if (!isClickInsideElement && !['increase-size', 'decrease-size'].includes(event.target.getAttribute('action'))) {
            if(document.querySelector(".toggle-options").classList.contains('active')) {
                document.querySelector(".toggle-options").classList.remove('active')
            }
        }
    });

    jQuery('button.menu-btn').click(function () {
        var headerHeight = document.querySelector(
            ".bottom-header-contain.desktop-only"
        ).offsetTop;

        if(jQuery(window).scrollTop() <= headerHeight && jQuery(window).width() > 829) {
            jQuery(".bottom-header-contain.post-header").removeClass("active");
            jQuery("body").removeClass("mobile-menu-opened");
        }
    });

    jQuery('button[action="language-options"]').click(function () {
        jQuery(this.parentNode.querySelector(".toggle-language-options")).toggleClass(
            "active"
        );
    });

    const shareData = {
        title: document.title,
        text: "",
        url: document.location.href,
    };

    const btn = document.querySelector('button[action="share-navigator"]');
    const resultPara = document.querySelector("body");

    if(document.location.protocol != 'http:') {
        btn.addEventListener("click", () => {
            try {
                navigator.share(shareData);
            } catch (err) {
                resultPara.textContent = "Error: " + err;
            }
        });
    } else {
        console.log("Native share is not allowed over HTTP protocol.")
    }

    document.querySelector('.more-menu').addEventListener("mouseover", () => {
        jQuery(".more-menu--content").addClass('permahover');
    });

    document.querySelector('.mobile-sidebar').childNodes.forEach( childNode => {
        childNode.addEventListener("mouseover", () => {
            if(childNode.className != 'more-menu') {
                jQuery(".more-menu--content").removeClass('permahover');
            }
        })
    } );

    window.addEventListener('click', function(e){   
        if (!document.querySelector('.more-menu--content').contains(e.target) &&
        !document.querySelector('.more-menu').contains(e.target)
        ){
            jQuery(".more-menu--content").removeClass('permahover');
        }
      });
});
