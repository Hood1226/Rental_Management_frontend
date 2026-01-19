import { useState, useMemo } from 'react'
import { Search, Plus, Download, X, Eye, Edit, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Settings2, GripVertical } from 'lucide-react'

function DataGrid({
  data = [],
  columns: initialColumns = [],
  onAdd,
  onEdit,
  onView,
  onDelete,
  searchPlaceholder = 'Search...',
  searchFields = [],
  emptyMessage = 'No data found',
  renderActions,
  getRowId = (row, index) => row.id || index,
  enablePagination = true,
  pageSize = 10,
  enableExport = true,
  enableSearch = true,
  enableSorting = true,
  enableColumnToggle = true,
  enableColumnReorder = true,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [columns, setColumns] = useState(initialColumns.map((col, idx) => ({ ...col, visible: true, order: idx })))
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [draggedColumn, setDraggedColumn] = useState(null)

  // Get visible columns in order
  const visibleColumns = useMemo(() => {
    return columns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order)
  }, [columns])

  // Sorting function
  const handleSort = (accessor) => {
    if (!enableSorting) return
    
    let direction = 'asc'
    if (sortConfig.key === accessor && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === accessor && sortConfig.direction === 'desc') {
      direction = null
    }
    
    setSortConfig({ key: accessor, direction })
  }

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.direction || !sortConfig.key) return data

    return [...data].sort((a, b) => {
      const aValue = typeof sortConfig.key === 'function' ? sortConfig.key(a) : a[sortConfig.key]
      const bValue = typeof sortConfig.key === 'function' ? sortConfig.key(b) : b[sortConfig.key]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || searchFields.length === 0) return sortedData

    const query = searchQuery.toLowerCase()
    return sortedData.filter((row) =>
      searchFields.some((field) => {
        const value = typeof field === 'string' ? row[field] : field(row)
        return value?.toString().toLowerCase().includes(query)
      })
    )
  }, [sortedData, searchQuery, searchFields])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = enablePagination 
    ? filteredData.slice(startIndex, endIndex)
    : filteredData

  // Reset to page 1 when search changes
  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // Export to Excel (CSV format)
  const handleExport = () => {
    if (filteredData.length === 0) {
      alert('No data to export')
      return
    }

    const BOM = '\uFEFF'
    const headers = visibleColumns
      .filter(col => !col.hideInExport)
      .map((col) => col.header || col.accessor)
      .join(',')
    
    const rows = filteredData.map((row) =>
      visibleColumns
        .filter(col => !col.hideInExport)
        .map((col) => {
          let value = typeof col.accessor === 'function'
            ? col.accessor(row)
            : row[col.accessor]
          
          if (value instanceof Date) {
            value = value.toLocaleDateString()
          }
          
          const stringValue = String(value || '')
            .replace(/"/g, '""')
            .replace(/\n/g, ' ')
          
          return `"${stringValue}"`
        })
        .join(',')
    )

    const csvContent = BOM + [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const timestamp = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `export_${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Toggle column visibility
  const toggleColumn = (index) => {
    setColumns(cols => cols.map((col, idx) => 
      idx === index ? { ...col, visible: !col.visible } : col
    ))
  }

  // Reorder columns
  const handleDragStart = (index) => {
    setDraggedColumn(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedColumn === null || draggedColumn === index) return

    const newColumns = [...columns]
    const draggedItem = newColumns[draggedColumn]
    newColumns.splice(draggedColumn, 1)
    newColumns.splice(index, 0, draggedItem)
    
    newColumns.forEach((col, idx) => {
      col.order = idx
    })
    
    setColumns(newColumns)
    setDraggedColumn(index)
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
  }

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="w-full mb-6">
      {/* Header - Fully Responsive */}
      <div className="bg-white rounded-t-lg border border-gray-200 shadow-sm">
        <div className="px-3 sm:px-4 md:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search - Responsive Width */}
            {enableSearch && searchFields.length > 0 && (
              <div className="w-full sm:flex-1 relative order-1 sm:order-1">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons - Responsive Layout */}
            <div className="flex items-center gap-2 order-2 sm:order-2 justify-end sm:justify-start">
              {/* Column Settings */}
              {enableColumnToggle && (
                <div className="relative">
                  <button
                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                    className="p-2 sm:p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all active:scale-95"
                    title="Column Settings"
                  >
                    <Settings2 size={16} className="sm:w-[18px] sm:h-[18px] text-gray-600" />
                  </button>
                  
                  {showColumnSettings && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowColumnSettings(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[70vh] sm:max-h-96 overflow-auto">
                        <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
                          <h3 className="font-semibold text-xs sm:text-sm text-gray-800">Manage Columns</h3>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Show/hide and reorder</p>
                        </div>
                        <div className="p-1.5 sm:p-2">
                          {columns.map((col, index) => (
                            <div
                              key={index}
                              draggable={enableColumnReorder}
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-md hover:bg-gray-50 transition-colors ${
                                draggedColumn === index ? 'opacity-50 bg-blue-50' : ''
                              } ${enableColumnReorder ? 'cursor-move' : ''}`}
                            >
                              {enableColumnReorder && (
                                <GripVertical size={14} className="text-gray-400 flex-shrink-0" />
                              )}
                              <input
                                type="checkbox"
                                checked={col.visible}
                                onChange={() => toggleColumn(index)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                              />
                              <span className="text-xs sm:text-sm text-gray-700 flex-1 truncate">
                                {col.header || col.accessor}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Export Button */}
              {enableExport && filteredData.length > 0 && (
                <button
                  onClick={handleExport}
                  className="p-2 sm:p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all active:scale-95 shadow-sm"
                  title="Export to Excel"
                >
                  <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              )}

              {/* Add Button */}
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="p-2 sm:p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                  title="Add New"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Container - Responsive Scroll */}
      <div className="bg-white rounded-b-lg border-x border-b border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-px">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((column, index) => (
                  <th
                    key={index}
                    onClick={() => column.sortable !== false && handleSort(column.accessor)}
                    className={`px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap ${
                      enableSorting && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                    } ${column.className || ''}`}
                    style={{ minWidth: column.minWidth }}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="truncate">{column.header || column.accessor}</span>
                      {enableSorting && column.sortable !== false && (
                        <span className="text-gray-400 flex-shrink-0">
                          {sortConfig.key === column.accessor ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600" />
                            ) : sortConfig.direction === 'desc' ? (
                              <ArrowDown size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600" />
                            ) : (
                              <ArrowUpDown size={12} className="sm:w-3.5 sm:h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown size={12} className="sm:w-3.5 sm:h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onView || onDelete || renderActions) && (
                  <th className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <tr 
                    key={getRowId(row, index)} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {visibleColumns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 ${
                          column.cellClassName || ''
                        }`}
                      >
                        <div className={column.truncate ? 'truncate max-w-[150px] sm:max-w-xs' : ''}>
                          {column.render
                            ? column.render(row, index)
                            : typeof column.accessor === 'function'
                            ? column.accessor(row)
                            : row[column.accessor]}
                        </div>
                      </td>
                    ))}
                    {(onEdit || onView || onDelete || renderActions) && (
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-sm font-medium whitespace-nowrap">
                        {renderActions ? (
                          renderActions(row, index)
                        ) : (
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            {onView && (
                              <button
                                onClick={() => onView(row)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                                title="View"
                              >
                                <Eye size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                className="p-1.5 sm:p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all active:scale-95"
                                title="Edit"
                              >
                                <Edit size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(row)}
                                className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                                title="Delete"
                              >
                                <X size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={visibleColumns.length + (onEdit || onView || onDelete || renderActions ? 1 : 0)}
                    className="px-4 sm:px-6 py-8 sm:py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search size={40} className="sm:w-12 sm:h-12 text-gray-300 mb-2 sm:mb-3" />
                      <p className="text-base sm:text-lg font-medium">
                        {searchQuery ? 'No results found' : emptyMessage}
                      </p>
                      {searchQuery && (
                        <p className="text-xs sm:text-sm mt-1">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Fully Responsive */}
        {enablePagination && filteredData.length > pageSize && (
          <div className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Results Info - Responsive Text */}
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                <span className="hidden sm:inline">Showing </span>
                <span className="font-medium">{startIndex + 1}</span>
                <span className="hidden sm:inline"> to </span>
                <span className="sm:hidden">-</span>
                <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span>
                <span className="hidden sm:inline"> of </span>
                <span className="sm:hidden">/</span>
                <span className="font-medium">{filteredData.length}</span>
                <span className="hidden sm:inline"> results</span>
              </div>

              {/* Pagination Controls - Responsive Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  title="Previous page"
                >
                  <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                </button>

                {/* Page Numbers - Hidden on Mobile */}
                <div className="hidden md:flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* Mobile/Tablet: Current Page Display */}
                <div className="md:hidden px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  title="Next page"
                >
                  <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataGrid