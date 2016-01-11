/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint expr: true */

/* bender-tags: treemodel, operation */
/* global describe, before, beforeEach, it, expect */

'use strict';

const modules = bender.amd.require(
	'core/treemodel/rootelement',
	'core/treemodel/node',
	'core/treemodel/position',
	'core/treemodel/range',
	'core/treemodel/attribute',
	'core/treemodel/operation/transform',
	'core/treemodel/operation/insertoperation',
	'core/treemodel/operation/attributeoperation',
	'core/treemodel/operation/moveoperation',
	'core/treemodel/operation/nooperation'
);

describe( 'transform', () => {
	let RootElement, Node, Position, Range, Attribute, InsertOperation, AttributeOperation, MoveOperation, NoOperation;
	let transform;

	before( () => {
		RootElement = modules[ 'core/treemodel/rootelement' ];
		Node = modules[ 'core/treemodel/node' ];
		Position = modules[ 'core/treemodel/position' ];
		Range = modules[ 'core/treemodel/range' ];
		Attribute = modules[ 'core/treemodel/attribute' ];
		InsertOperation = modules[ 'core/treemodel/operation/insertoperation' ];
		AttributeOperation = modules[ 'core/treemodel/operation/attributeoperation' ];
		MoveOperation = modules[ 'core/treemodel/operation/moveoperation' ];
		NoOperation = modules[ 'core/treemodel/operation/nooperation' ];

		transform = modules[ 'core/treemodel/operation/transform' ];
	} );

	let root, op, nodeA, nodeB, expected, baseVersion;

	beforeEach( () => {
		root = new RootElement( null );

		nodeA = new Node();
		nodeB = new Node();

		baseVersion = 0;
	} );

	function expectOperation( op, params ) {
		for ( let i in params ) {
			if ( params.hasOwnProperty( i ) ) {
				if ( i == 'type' ) {
					expect( op ).to.be.instanceof( params[ i ] );
				}
				else if ( params[ i ] instanceof Array ) {
					expect( op[ i ].length ).to.equal( params[ i ].length );

					for ( let j = 0; j < params[ i ].length; j++ ) {
						expect( op[ i ][ j ] ).to.equal( params[ i ][ j ] );
					}
				} else if ( params[ i ] instanceof Position || params[ i ] instanceof Range ) {
					expect( op[ i ].isEqual( params[ i ] ) ).to.be.true;
				} else {
					expect( op[ i ] ).to.equal( params[ i ] );
				}
			}
		}
	}

	describe( 'InsertOperation', () => {
		let nodeC, nodeD, position;

		beforeEach( () => {
			nodeC = new Node();
			nodeD = new Node();

			position = new Position( root, [ 0, 2, 1 ] );

			op = new InsertOperation( position, [ nodeA, nodeB ], baseVersion );

			expected = {
				type: InsertOperation,
				position: Position.createFromPosition( position ),
				baseVersion: baseVersion + 1
			};
		} );

		describe( 'by InsertOperation', () => {
			it( 'target at different position: no position update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 1, 3, 2 ] ),
					[ nodeC, nodeD ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target at offset before: increment offset', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 0, 2, 0 ] ),
					[ nodeC, nodeD ],
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target at same offset and is important: increment offset', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 0, 2, 1 ] ),
					[ nodeC, nodeD ],
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target at same offset and is less important: no position update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 0, 2, 1 ] ),
					[ nodeC, nodeD ],
					baseVersion
				);

				let transOp = transform( transformBy, true );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target at offset after: no position update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 0, 2, 2 ] ),
					[ nodeC, nodeD ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target before node from path: increment index on path', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 0, 1 ] ),
					[ nodeC, nodeD ],
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.path[ 1 ] += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target after node from path: no position update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 0, 6 ] ),
					[ nodeC, nodeD ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );

		describe( 'by AttributeOperation', () => {
			it( 'no position update', () => {
				let transformBy = new AttributeOperation(
					Range.createFromPositionAndShift( position, 2 ),
					null,
					new Attribute( 'foo', 'bar' ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );

		describe( 'by MoveOperation', () => {
			it( 'range and target are different than insert position: no position update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 1, 3, 2 ] ),
					2,
					new Position( root, [ 2, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range offset is before insert position offset: decrement offset', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 0, 2, 0 ] ),
					1,
					new Position( root, [ 1, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.offset--;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range offset is after insert position offset: no position update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 0, 2, 4 ] ),
					1,
					new Position( root, [ 1, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset before insert position offset: increment offset', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 1, 1 ] ),
					2,
					new Position( root, [ 0, 2, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset after insert position offset: no position update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 1, 1 ] ),
					2,
					new Position( root, [ 0, 2, 4 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset same as insert position offset and is important: increment offset', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 1, 1 ] ),
					2,
					new Position( root, [ 0, 2, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset same as insert position offset and is less important: no position update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 1, 1 ] ),
					2,
					new Position( root, [ 0, 2, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range is before node from insert position path: decrement index on path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 0, 0 ] ),
					2,
					new Position( root, [ 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.path[ 1 ] -= 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range is after node from insert position path: no position update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 0, 4 ] ),
					2,
					new Position( root, [ 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target before node from insert position path: increment index on path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 1, 0 ] ),
					2,
					new Position( root, [ 0, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.path[ 1 ] += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target after node from insert position path: no position update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 1, 0 ] ),
					2,
					new Position( root, [ 0, 4 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range has node that contains insert position: update position', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 0, 1 ] ),
					2,
					new Position( root, [ 1, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.path = [ 1, 2, 1 ];

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range contains insert position (on same level): set position offset to range start', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 0, 2, 0 ] ),
					3,
					new Position( root, [ 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );
				expected.position.offset = 0;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );

		describe( 'by NoOperation', () => {
			it( 'no operation update', () => {
				let transformBy = new NoOperation( baseVersion );

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );
	} );

	describe( 'AttributeOperation', () => {
		let start, end, range, oldAttr, newAttr, anotherOldAttr, anotherNewAttr;

		beforeEach( () => {
			oldAttr = new Attribute( 'foo', 'abc' );
			newAttr = new Attribute( 'foo', 'bar' );

			anotherOldAttr = new Attribute( oldAttr.key, 'another' );
			anotherNewAttr = new Attribute( oldAttr.key, 'anothernew' );

			expected = {
				type: AttributeOperation,
				oldAttr: oldAttr,
				newAttr: newAttr,
				baseVersion: baseVersion + 1
			};
		} );

		describe( 'with multi-level range', () => {
			beforeEach( () => {
				start = new Position( root, [ 1, 2 ] );
				end = new Position( root, [ 2, 2, 4 ] );

				range = new Range( start, end );

				op = new AttributeOperation( range, oldAttr, newAttr, baseVersion );

				expected.range = new Range( start, end );
			} );

			describe( 'by InsertOperation', () => {
				it( 'target at different position: no operation update', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 3, 3, 2 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target at offset before: increment offset', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 1, 1 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.offset += 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target at same offset: increment offset', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 1, 2 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.offset += 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target at offset after: no operation update', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 3, 2 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target before node from path: increment index on path', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 0 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.path[ 0 ] += 2;
					expected.range.end.path[ 0 ] += 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target after node from path: no position change', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 2, 6 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target inside change range: split into two operations', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 1, 3, 1 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expected.range.start.path = [ 1, 3, 3 ];

					expectOperation( transOp[ 0 ], expected );

					expected.range.start = op.range.start;
					expected.range.end.path = [ 1, 3, 1 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );
			} );

			describe( 'by AttributeOperation', () => {
				it( 'attributes have different key: no operation update', () => {
					let transformBy = new AttributeOperation(
						Range.createFromRange( range ),
						new Attribute( 'abc', true ),
						new Attribute( 'abc', false ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'attributes set same value: no operation update', () => {
					let transformBy = new AttributeOperation(
						Range.createFromRange( range ),
						oldAttr,
						newAttr,
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'both operations removes attribute: no operation update', () => {
					op.newAttr = null;

					let transformBy = new AttributeOperation(
						new Range( new Position( root, [ 1, 1, 4 ] ), new Position( root, [ 3 ] ) ),
						anotherOldAttr,
						null,
						baseVersion
					);

					let transOp = transform( op, transformBy, true );

					expected.newAttr = null;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				describe( 'that is less important and', () => {
					it( 'range does not intersect original range: no operation update', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 3, 0 ] ), new Position( root, [ 4 ] ) ),
							anotherOldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy, true );

						expect( transOp.length ).to.equal( 1 );
						expectOperation( transOp[ 0 ], expected );
					} );

					it( 'range contains original range: update oldAttr', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 1, 1, 4 ] ), new Position( root, [ 3 ] ) ),
							anotherOldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy, true );

						expected.oldAttr = anotherOldAttr;

						expect( transOp.length ).to.equal( 1 );
						expectOperation( transOp[ 0 ], expected );
					} );

					// [ original range   <   ]   range transformed by >
					it( 'range intersects on left: split into two operations, update oldAttr', () => {
						// Get more test cases and better code coverage
						op.newAttr = null;

						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 1, 4, 2 ] ), new Position( root, [ 3 ] ) ),
							anotherOldAttr,
							// Get more test cases and better code coverage
							anotherNewAttr,
							baseVersion
						);

						let transOp = transform( op, transformBy, true );

						expect( transOp.length ).to.equal( 2 );

						expected.newAttr = null;

						expected.range.end.path = [ 1, 4, 2 ];

						expectOperation( transOp[ 0 ], expected );

						expected.range.start.path = [ 1, 4, 2 ];
						expected.range.end = op.range.end;
						expected.oldAttr = anotherOldAttr;
						expected.baseVersion++;

						expectOperation( transOp[ 1 ], expected );
					} );

					// [  range transformed by  <   ]  original range  >
					it( 'range intersects on right: split into two operations, update oldAttr', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 1 ] ), new Position( root, [ 2, 1 ] ) ),
							anotherOldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy, true );

						expect( transOp.length ).to.equal( 2 );

						expected.range.start.path = [ 2, 1 ];

						expectOperation( transOp[ 0 ], expected );

						expected.range.start = op.range.start;
						expected.range.end.path = [ 2, 1 ];
						expected.oldAttr = anotherOldAttr;
						expected.baseVersion++;

						expectOperation( transOp[ 1 ], expected );
					} );

					it( 'range is inside original range: split into three operations, update oldAttr', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 1, 4, 1 ] ), new Position( root, [ 2, 1 ] ) ),
							anotherOldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy, true );

						expect( transOp.length ).to.equal( 3 );

						expected.range.end.path = [ 1, 4, 1 ];

						expectOperation( transOp[ 0 ], expected );

						expected.range.start.path = [ 2, 1 ];
						expected.range.end = op.range.end;
						expected.baseVersion++;

						expectOperation( transOp[ 1 ], expected );

						expected.range.start.path = [ 1, 4, 1 ];
						expected.range.end.path = [ 2, 1 ];
						expected.oldAttr = anotherOldAttr;
						expected.baseVersion++;

						expectOperation( transOp[ 2 ], expected );
					} );
				} );

				describe( 'that is more important and', () => {
					it( 'range does not intersect original range: no operation update', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 3, 0 ] ), new Position( root, [ 4 ] ) ),
							oldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy );

						expect( transOp.length ).to.equal( 1 );
						expectOperation( transOp[ 0 ], expected );
					} );

					it( 'range contains original range: convert to NoOperation', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 1, 1, 4 ] ), new Position( root, [ 3 ] ) ),
							oldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy );

						expect( transOp.length ).to.equal( 1 );
						expectOperation( transOp[ 0 ], {
							type: NoOperation,
							baseVersion: baseVersion + 1
						} );
					} );

					// [ original range   <   ]   range transformed by >
					it( 'range intersects on left: shrink original range', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 1, 4, 2 ] ), new Position( root, [ 3 ] ) ),
							oldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy );

						expected.range.end.path = [ 1, 4, 2 ];

						expect( transOp.length ).to.equal( 1 );
						expectOperation( transOp[ 0 ], expected );
					} );

					// [  range transformed by  <   ]  original range  >
					it( 'range intersects on right: shrink original range', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 1 ] ), new Position( root, [ 2, 1 ] ) ),
							oldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy );

						expected.range.start.path = [ 2, 1 ];

						expect( transOp.length ).to.equal( 1 );
						expectOperation( transOp[ 0 ], expected );
					} );

					it( 'range is inside original range: split into two operations', () => {
						let transformBy = new AttributeOperation(
							new Range( new Position( root, [ 1, 4, 1 ] ), new Position( root, [ 2, 1 ] ) ),
							oldAttr,
							null,
							baseVersion
						);

						let transOp = transform( op, transformBy );

						expect( transOp.length ).to.equal( 2 );

						expected.range.end.path = [ 1, 4, 1 ];

						expectOperation( transOp[ 0 ], expected );

						expected.range.start.path = [ 2, 1 ];
						expected.range.end = op.range.end;
						expected.baseVersion++;

						expectOperation( transOp[ 1 ], expected );
					} );
				} );
			} );

			describe( 'by MoveOperation', () => {
				it( 'range and target are different than change range: no operation update', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 1, 1, 2 ] ),
						2,
						new Position( root, [ 3, 4 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'range offset is before change range start offset: decrement offset', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 1, 0 ] ),
						2,
						new Position( root, [ 3, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.offset -= 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target offset is before change range start offset: increment offset', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 3, 4, 1 ] ),
						2,
						new Position( root, [ 1, 0 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.offset += 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'range is before node from path to change range: decrement index on path', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 0 ] ),
						1,
						new Position( root, [ 2, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.path[ 0 ]--;
					expected.range.end.path[ 0 ]--;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'range is after node from path to change range: no position change', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 3 ] ),
						2,
						new Position( root, [ 0, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target before node from path to change range: increment index on path', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 3, 4, 1 ] ),
						2,
						new Position( root, [ 1, 0 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.path[ 1 ] += 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target after node from path to change range: no position change', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 3, 4, 1 ] ),
						2,
						new Position( root, [ 3 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'range intersects on left with change range: split into two operations', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 2, 1 ] ),
						3,
						new Position( root, [ 4 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expected.range.end.path = [ 2, 1 ];

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.path = [ 4 ];
					expected.range.end.path = [ 5, 4 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );

				it( 'range intersects on right with change range: split into two operation', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 1, 1 ] ),
						3,
						new Position( root, [ 0, 0 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expected.range.start.path = [ 1, 1 ];

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.path = [ 0, 1 ];
					expected.range.end.path = [ 0, 3 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );

				it( 'range contains change range: update change range', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 1 ] ),
						2,
						new Position( root, [ 3, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.path = [ 1, 4, 1, 2 ];
					expected.range.end.path = [ 1, 4, 2, 2, 4 ];

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'range is inside change range: split into two operations', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 1, 4 ] ),
						2,
						new Position( root, [ 3, 2 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.path = [ 3, 2 ];
					expected.range.end.path = [ 3, 4 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );

				it( 'target inside change range: split into two operations', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 3, 4, 1 ] ),
						2,
						new Position( root, [ 1, 4 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expected.range.start.path = [ 1, 6 ];

					expectOperation( transOp[ 0 ], expected );

					expected.range.start = op.range.start;
					expected.range.end.path = [ 1, 4 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );

				it( 'range intersects change range and target inside change range: split into three operations', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 1, 1 ] ),
						3,
						new Position( root, [ 2 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 3 );

					expected.range.start.path = [ 5 ];
					expected.range.end.path = [ 5, 2, 4 ];

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.path = [ 1, 1 ];
					expected.range.end.path = [ 2 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );

					expected.range.start.path = [ 3 ];
					expected.range.end.path = [ 5 ];
					expected.baseVersion++;

					expectOperation( transOp[ 2 ], expected );
				} );
			} );

			describe( 'by NoOperation', () => {
				it( 'no operation update', () => {
					let transformBy = new NoOperation( baseVersion );

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );
			} );
		} );

		// Some extra cases for a AttributeOperation that operates on single tree level range.
		// This means that the change range start and end differs only on offset value.
		// This test suite also have some modifications to the original operation
		// to get more test cases covered and better code coverage.
		describe( 'with single-level range', () => {
			beforeEach( () => {
				start = new Position( root, [ 0, 2, 1 ] );
				end = new Position( root, [ 0, 2, 4 ] );

				range = new Range( start, end );

				op = new AttributeOperation( range, oldAttr, newAttr, baseVersion );

				expected.range = new Range( start, end );
			} );

			describe( 'by InsertOperation', () => {
				it( 'target at offset before: increment offset', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 0, 2, 0 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.offset += 2;
					expected.range.end.offset += 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target at same offset: increment offset', () => {
					let transformBy = new InsertOperation(
						new Position( root, [ 0, 2, 1 ] ),
						[ nodeA, nodeB ],
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.offset += 2;
					expected.range.end.offset += 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );
			} );

			describe( 'by MoveOperation', () => {
				it( 'range offset is before change range start offset: decrement offset', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 0, 2, 0 ] ),
						1,
						new Position( root, [ 2, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.offset--;
					expected.range.end.offset--;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target offset is before change range start offset: increment offset', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 2, 4, 1 ] ),
						2,
						new Position( root, [ 0, 2, 0 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.offset += 2;
					expected.range.end.offset += 2;

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'range intersects on left with change range: split into two operations', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 0, 2, 2 ] ),
						4,
						new Position( root, [ 2, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expected.range.end.offset -= 2;

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.path = [ 2, 4, 1 ];
					expected.range.end.path = [ 2, 4, 3 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );

				it( 'range intersects on right with change range: split into two operation', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 0, 2, 0 ] ),
						2,
						new Position( root, [ 2, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expected.range.start.offset -= 1;
					expected.range.end.offset -= 2;

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.path = [ 2, 4, 2 ];
					expected.range.end.path = [ 2, 4, 3 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );

				it( 'range contains change range: update change range', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 0, 1 ] ),
						3,
						new Position( root, [ 2, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.path = [ 2, 4, 2, 1 ];
					expected.range.end.path = [ 2, 4, 2, 4 ];

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'range is inside change range: split into two operations', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 0, 2, 2 ] ),
						1,
						new Position( root, [ 2, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expected.range.end.offset--;

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.path = [ 2, 4, 1 ];
					expected.range.end.path = [ 2, 4, 2 ];
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );

				it( 'range is same as change range: update change range', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 0, 2, 1 ] ),
						3,
						new Position( root, [ 2, 4, 1 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expected.range.start.path = [ 2, 4, 1 ];
					expected.range.end.path = [ 2, 4, 4 ];

					expect( transOp.length ).to.equal( 1 );
					expectOperation( transOp[ 0 ], expected );
				} );

				it( 'target inside change range: split into two operations', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 2, 4, 1 ] ),
						2,
						new Position( root, [ 0, 2, 2 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 2 );

					expected.range.start.offset = 4;
					expected.range.end.offset = 6;

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.offset = op.range.start.offset;
					expected.range.end.offset = 2;
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );
				} );

				it( 'range intersects change range and target inside change range: split into three operations', () => {
					let transformBy = new MoveOperation(
						new Position( root, [ 0, 2, 0 ] ),
						2,
						new Position( root, [ 0, 2, 3 ] ),
						baseVersion
					);

					let transOp = transform( op, transformBy );

					expect( transOp.length ).to.equal( 3 );

					expected.range.start.offset = 3;
					expected.range.end.offset = 4;

					expectOperation( transOp[ 0 ], expected );

					expected.range.start.offset = 0;
					expected.range.end.offset = 1;
					expected.baseVersion++;

					expectOperation( transOp[ 1 ], expected );

					expected.range.start.offset = 2;
					expected.range.end.offset = 3;
					expected.baseVersion++;

					expectOperation( transOp[ 2 ], expected );
				} );
			} );
		} );
	} );

	describe( 'MoveOperation', () => {
		let sourcePosition, targetPosition, rangeEnd, howMany;

		beforeEach( () => {
			sourcePosition = new Position( root, [ 2, 2, 4 ] );
			targetPosition = new Position( root, [ 3, 3, 3 ] );
			howMany = 2;

			rangeEnd = Position.createFromPosition( sourcePosition );
			rangeEnd.offset += howMany;

			op = new MoveOperation( sourcePosition, howMany, targetPosition, baseVersion );

			expected = {
				type: MoveOperation,
				sourcePosition: Position.createFromPosition( sourcePosition ),
				targetPosition: Position.createFromPosition( targetPosition ),
				howMany: howMany,
				baseVersion: baseVersion + 1
			};
		} );

		describe( 'by InsertOperation', () => {
			it( 'target at different position than move range and target: no operation update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 1, 3, 2 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target inside node from move range: no operation update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 2, 2, 3, 1 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target at offset before range offset: increment range offset', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 2, 2, 0 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.sourcePosition.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target at offset after range offset: no operation update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 2, 2, 6 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target before node from range start path: increment index on range start path', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 2, 0 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.sourcePosition.path[ 1 ] += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target after node from range start path: no operation update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 2, 3 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset before move target offset: increment target offset', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 3, 3, 2 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset after move target offset: no operation update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 3, 3, 4 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target before node from move target position path: increment index on move target position path', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 3, 0 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.path[ 1 ] += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target after node from move target position path: no operation update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 3, 6 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset same as move target offset and is important: increment target offset', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 3, 3, 3 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset same as move target offset and is less important: no operation update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 3, 3, 3 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset same as move target offset and is important: increment target offset', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 3, 3 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.path[ 1 ] += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target inside move range: split into two operations', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 2, 2, 5 ] ),
					[ nodeA, nodeB ],
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 2 );

				expected.sourcePosition.path = [ 2, 2, 7 ];
				expected.howMany = 1;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.path = [ 2, 2, 4 ];
				expected.howMany = 1;
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );
			} );
		} );

		describe( 'by AttributeOperation', () => {
			it( 'no operation update', () => {
				let transformBy = new AttributeOperation(
					new Range( sourcePosition, rangeEnd ),
					new Attribute( 'abc', true ),
					new Attribute( 'abc', false ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );

		describe( 'by MoveOperation', () => {
			it( 'range and target different than transforming range and target: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 1, 2 ] ),
					3,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset before transforming range start offset: increment range offset', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 2, 2, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.sourcePosition.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset after transforming range start offset: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 2, 2, 7 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range start offset before transforming range start offset: decrement range offset', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 0 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.sourcePosition.offset -= 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range start offset after transforming range start offset: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 9 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target before node from transforming range start path: increment index on range start path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 2, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.sourcePosition.path[ 1 ] += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target after node from transforming range start path: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 2, 5 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range before node from transforming range start path: decrement index on range start path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 0 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.sourcePosition.path[ 1 ] -= 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range after node from transforming range start path: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 3 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset before transforming target offset: increment target offset', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 3, 3, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.offset += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target offset after transforming target offset: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 3, 3, 5 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range offset before transforming target offset: decrement target offset', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 3, 3, 0 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.offset -= 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range offset after transforming target offset: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 3, 3, 5 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target before node from transforming target path: increment index on target path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 3, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.path[ 1 ] += 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target after node from transforming target path: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 3, 5 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range before node from transforming target path: decrement index on target path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 3, 0 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.path[ 1 ] -= 2;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range after node from transforming target path: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 3, 5 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target inside transforming move range: split into two operations', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 2, 2, 5 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 2 );

				expected.howMany = 1;
				expected.sourcePosition.offset = 7;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.offset = 4;
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );
			} );

			it( 'target inside a node from transforming range: no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 4, 1, 0 ] ),
					2,
					new Position( root, [ 2, 2, 5, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range has node that contains transforming range: update range path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 1 ] ),
					3,
					new Position( root, [ 4, 2 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.sourcePosition.path = [ 4, 3, 4 ];

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range has node that contains transforming target: update target path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 3, 2 ] ),
					3,
					new Position( root, [ 0, 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.targetPosition.path = [ 0, 2, 3 ];

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'target inside a node from transforming range and vice versa: reverse transform-by operation', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 3, 2 ] ),
					3,
					new Position( root, [ 2, 2, 5, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );
				let reversed = transformBy.getReversed();

				expected.sourcePosition = reversed.sourcePosition;
				expected.targetPosition = reversed.targetPosition;
				expected.howMany = reversed.howMany;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range is same as transforming range and is important: convert to NoOperation', () => {
				let transformBy = new MoveOperation(
					op.sourcePosition,
					op.howMany,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], {
					type: NoOperation,
					baseVersion: baseVersion + 1
				} );
			} );

			it( 'range is same as transforming range and is less important: update range path', () => {
				let transformBy = new MoveOperation(
					op.sourcePosition,
					op.howMany,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expected.sourcePosition.path = [ 4, 1, 0 ];

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range contains transforming range and is important: convert to NoOperation', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 3 ] ),
					4,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], {
					type: NoOperation,
					baseVersion: baseVersion + 1
				} );
			} );

			it( 'range contains transforming range and is less important: update range path', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 3 ] ),
					4,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expected.sourcePosition.path = [ 4, 1, 1 ];

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range contains transforming range and target and is important: update range path and target', () => {
				op.targetPosition.path = [ 2, 2, 7 ];

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 3 ] ),
					5,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );

				expected.sourcePosition.path = [ 4, 1, 1 ];
				expected.targetPosition.path = [ 4, 1, 4 ];

				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range contains transforming range and target and is less important: update range path and target', () => {
				op.targetPosition.path = [ 2, 2, 7 ];

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 3 ] ),
					5,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 1 );

				expected.sourcePosition.path = [ 4, 1, 1 ];
				expected.targetPosition.path = [ 4, 1, 4 ];

				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range intersects on left side of transforming range and is important: shrink range', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 3 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.sourcePosition.path = [ 2, 2, 3 ];
				expected.howMany = 1;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range intersects on left side of transforming range and is less important: split into two operations', () => {
				// Get more test cases and better code coverage
				let otherRoot = new RootElement( null );

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 3 ] ),
					2,
					new Position( otherRoot, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 2 );

				expected.sourcePosition.path = [ 2, 2, 3 ];
				expected.howMany = 1;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition = new Position( otherRoot, [ 4, 1, 1 ] );
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );
			} );

			it( 'range intersects on right side of transforming range and is important: shrink range', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 5 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expected.howMany = 1;

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range intersects on right side of transforming range and is less important: split into two operations', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 5 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 2 );

				expected.sourcePosition.path = [ 4, 1, 0 ];
				expected.howMany = 1;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.path = op.sourcePosition.path;
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );
			} );

			it( 'range intersects on left side, target inside transforming range and is important: split into two operations', () => {
				op.howMany = 4;

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 3 ] ),
					2,
					new Position( root, [ 2, 2, 6 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 2 );

				expected.sourcePosition.path = [ 2, 2, 6 ];
				expected.howMany = 2;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.path = [ 2, 2, 3 ];
				expected.howMany = 1;
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );
			} );

			it( 'range intersects on left side, target inside transforming range and is less important: split into three operations', () => {
				op.howMany = 4;

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 3 ] ),
					2,
					new Position( root, [ 2, 2, 6 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 3 );

				expected.sourcePosition.path = [ 2, 2, 6 ];
				expected.howMany = 2;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.path = [ 2, 2, 3 ];
				expected.howMany = 1;
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );

				expected.sourcePosition.path = [ 2, 2, 5 ];
				expected.howMany = 1;
				expected.baseVersion++;

				expectOperation( transOp[ 2 ], expected );
			} );

			it( 'range intersects on right side, target inside transforming range and is important: split into two operations', () => {
				op.howMany = 4;

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 7 ] ),
					2,
					new Position( root, [ 2, 2, 5 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 2 );

				expected.sourcePosition.path = [ 2, 2, 7 ];
				expected.howMany = 2;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.path = [ 2, 2, 4 ];
				expected.howMany = 1;
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );
			} );

			it( 'range intersects on right side, target inside transforming range and is less important: split into three operations', () => {
				op.howMany = 4;

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 7 ] ),
					2,
					new Position( root, [ 2, 2, 5 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 3 );

				expected.sourcePosition.path = [ 2, 2, 5 ];
				expected.howMany = 1;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.path = [ 2, 2, 7 ];
				expected.howMany = 2;
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );

				expected.sourcePosition.path = [ 2, 2, 4 ];
				expected.howMany = 1;
				expected.baseVersion++;

				expectOperation( transOp[ 2 ], expected );
			} );

			it( 'range inside transforming range and is important: split into two operations', () => {
				op.howMany = 4;

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 5 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 2 );

				expected.sourcePosition.path = [ 2, 2, 5 ];
				expected.howMany = 1;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.path = [ 2, 2, 4 ];
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );
			} );

			it( 'range inside transforming range and is less important: split into three operations', () => {
				op.howMany = 4;

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 5 ] ),
					2,
					new Position( root, [ 4, 1, 0 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 3 );

				expected.sourcePosition.path = [ 2, 2, 5 ];
				expected.howMany = 1;

				expectOperation( transOp[ 0 ], expected );

				expected.sourcePosition.path = [ 4, 1, 0 ];
				expected.howMany = 2;
				expected.baseVersion++;

				expectOperation( transOp[ 1 ], expected );

				expected.sourcePosition.path = [ 2, 2, 4 ];
				expected.howMany = 1;
				expected.baseVersion++;

				expectOperation( transOp[ 2 ], expected );
			} );

			it( 'range and target inside transforming range and is important: no operation update', () => {
				op.howMany = 6;

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 5 ] ),
					2,
					new Position( root, [ 2, 2, 9 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );

				expected.howMany = 6;

				expectOperation( transOp[ 0 ], expected );
			} );

			it( 'range and target inside transforming range and is less important: no operation update', () => {
				op.howMany = 6;

				let transformBy = new MoveOperation(
					new Position( root, [ 2, 2, 5 ] ),
					2,
					new Position( root, [ 2, 2, 9 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy, true );

				expect( transOp.length ).to.equal( 1 );

				expected.howMany = 6;

				expectOperation( transOp[ 0 ], expected );
			} );
		} );

		describe( 'by NoOperation', () => {
			it( 'no operation update', () => {
				let transformBy = new NoOperation( baseVersion );

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );
	} );

	describe( 'NoOperation', () => {
		beforeEach( () => {
			op = new NoOperation( baseVersion );

			expected = {
				type: NoOperation,
				baseVersion: baseVersion + 1
			};
		} );

		describe( 'by InsertOperation', () => {
			it( 'no operation update', () => {
				let transformBy = new InsertOperation(
					new Position( root, [ 0 ] ),
					'a',
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );

		describe( 'by AttributeOperation', () => {
			it( 'no operation update', () => {
				let transformBy = new AttributeOperation(
					new Range(
						new Position( root, [ 0 ] ),
						new Position( root, [ 1 ] )
					),
					new Attribute( 'foo', 'bar' ),
					new Attribute( 'foo', 'xyz' ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );

		describe( 'by MoveOperation', () => {
			it( 'no operation update', () => {
				let transformBy = new MoveOperation(
					new Position( root, [ 0 ] ),
					2,
					new Position( root, [ 1 ] ),
					baseVersion
				);

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );

		describe( 'by NoOperation', () => {
			it( 'no operation update', () => {
				let transformBy = new NoOperation( baseVersion );

				let transOp = transform( op, transformBy );

				expect( transOp.length ).to.equal( 1 );
				expectOperation( transOp[ 0 ], expected );
			} );
		} );
	} );
} );