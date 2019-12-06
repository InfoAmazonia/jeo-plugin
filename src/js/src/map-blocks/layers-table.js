import * as Table from 'reactabular-table';

export default ( {
	columns,
	rows,
	emptyMessage = null,
	className,
	children,
} ) => (
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
