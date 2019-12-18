import * as Table from 'reactabular-table';

const columns = [
	{ property: 'id', header: { label: 'ID' } },
	{ property: 'title', header: { label: 'Name' } },
];

export default ( {
	layers,
	loadingLayers,
	selectedLayers,
	emptyMessage = null,
	className,
	children,
} ) => {
	if ( loadingLayers ) {
		return <p>loading</p>;
	}
	const rows = layers.map( ( l ) => ( { id: l.id, title: l.title.rendered } ) );

	return (
		<Table.Provider columns={ columns } className={ className } rowKey="id">
			<Table.Header />
			<Table.Body rows={ rows } />
			<tfoot>
				<tr>
					<td colSpan={ columns.length }>
						{ ! rows.length && emptyMessage && (
							<p className="empty">{ emptyMessage }</p>
						) }
						{ children }
					</td>
				</tr>
			</tfoot>
		</Table.Provider>
	);
};
