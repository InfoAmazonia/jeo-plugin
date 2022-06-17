import BaseClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';

import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Bold, Italic } from '@ckeditor/ckeditor5-basic-styles';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { FontBackgroundColor, FontColor } from '@ckeditor/ckeditor5-font';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Link } from '@ckeditor/ckeditor5-link';
import { List } from '@ckeditor/ckeditor5-list';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';

class ClassicEditor extends BaseClassicEditor {};

ClassicEditor.builtinPlugins = [
	Autoformat,
	Bold,
	Essentials,
	FontBackgroundColor,
	FontColor,
	Heading,
	Italic,
	Link,
	List,
	Paragraph,
];

ClassicEditor.defaultConfig = {
	toolbar: [
		'undo', 'redo', '|',
		'bold', 'italic', '|',
		'heading', 'paragraph', 'link', 'bulletedList', 'numberedList', '|',
		'fontColor', 'fontBackgroundColor',
	],
};

export default ClassicEditor;
