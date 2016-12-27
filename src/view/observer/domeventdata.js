/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/view/observer/domeventdata
 */

import extend from 'ckeditor5-utils/src/lib/lodash/extend';

/**
 * Information about a DOM event in context of the {@link module:engine/view/document~Document}.
 * It wraps the native event, which usually should not be used as the wrapper contains
 * additional data (like key code for keyboard events).
 */
export default class DomEventData {
	/**
	 * @param {module:engine/view/document~Document} document The instance of the tree view Document.
	 * @param {Event} domEvent The DOM event.
	 * @param {Object} [additionalData] Additional properties that the instance should contain.
	 */
	constructor( document, domEvent, additionalData ) {
		/**
		 * The instance of the document.
		 *
		 * @readonly
		 * @member {module:engine/view/document~Document} module:engine/view/observer/observer~Observer.DomEvent#view
		 */
		this.document = document;

		/**
		 * The DOM event.
		 *
		 * @readonly
		 * @member {Event} module:engine/view/observer/observer~Observer.DomEvent#domEvent
		 */
		this.domEvent = domEvent;

		/**
		 * The DOM target.
		 *
		 * @readonly
		 * @member {HTMLElement} module:engine/view/observer/observer~Observer.DomEvent#target
		 */
		this.domTarget = domEvent.target;

		extend( this, additionalData );
	}

	/**
	 * The tree view element representing the target.
	 *
	 * @readonly
	 * @type module:engine/view/element~Element
	 */
	get target() {
		return this.document.domConverter.getCorrespondingViewElement( this.domTarget );
	}

	/**
	 * Prevents the native's event default action.
	 */
	preventDefault() {
		this.domEvent.preventDefault();
	}

	/**
	 * Stops native event propagation.
	 */
	stopPropagation() {
		this.domEvent.stopPropagation();
	}
}
