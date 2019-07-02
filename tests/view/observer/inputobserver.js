/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import InputObserver from '../../../src/view/observer/inputobserver';
import View from '../../../src/view/view';

describe( 'InputObserver', () => {
	let view, viewDocument, observer;

	beforeEach( () => {
		view = new View();
		viewDocument = view.document;
		observer = view.getObserver( InputObserver );
	} );

	afterEach( () => {
		view.destroy();
	} );

	it( 'should define domEventType', () => {
		expect( observer.domEventType ).to.contains( 'beforeinput' );
	} );

	it( 'should fire beforeinput with dom event data', () => {
		const spy = sinon.spy();

		viewDocument.on( 'beforeinput', spy );

		const domEvtData = {
			type: 'beforeinput'
		};

		observer.onDomEvent( domEvtData );

		expect( spy.calledOnce ).to.be.true;
		expect( spy.args[ 0 ][ 1 ].domEvent ).to.equal( domEvtData );
	} );
} );