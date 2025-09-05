import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-dt';

export const initializeDataTable = (tableRef: HTMLTableElement, options: any = {}) => {
    const defaultOptions = {
        destroy: true,
        retrieve: true,
        pageLength: 5,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        order: [[0, 'asc']],
        drawCallback: function () {
            // Reapply styles after each draw
            $('.dataTables_paginate').addClass('flex items-center gap-2');
            $('.dt-paging').addClass('flex items-center gap-2');
            $('.pagination').addClass('flex items-center gap-1 flex-wrap justify-center sm:justify-end');
            $('.page-link').addClass('border rounded px-2 sm:px-3 py-1 text-sm hover:bg-gray-100 transition-colors');
            $('.page-item.active .page-link').addClass('bg-fuchsia-800 text-white hover:bg-stone-800');
            $('.page-item.disabled .page-link').addClass('opacity-50 cursor-not-allowed hover:bg-transparent');
            $('.dt-paging-button').addClass('mx-1');
            $('.dt-paging-button:first-child').removeClass('mx-1').addClass('mr-1');
            $('.dt-paging-button:last-child').removeClass('mx-1').addClass('ml-1');

            // Reapply styles for length selector and search
            $('.dt-length select').addClass('border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent w-full sm:w-auto');
            $('.dt-length label').addClass('text-sm text-gray-600 flex items-center gap-2 font-medium whitespace-nowrap');
            $('.dt-length label').html(function (_, html) {
                return html.replace('Show', '<span class="font-bold">Show</span>');
            });
            $('.dt-search input').addClass('border rounded px-2 sm:px-3 py-1 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent');

            // Responsive table styles
            $('.dataTable').addClass('w-full min-w-[640px] sm:min-w-0');
            $('.dataTables_wrapper').addClass('w-full overflow-x-auto -mx-4 sm:mx-0');
        },
        initComplete: function () {
            // Style length selector
            $('.dt-length select').addClass('border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent w-full sm:w-auto');
            $('.dt-length label').addClass('text-sm text-gray-600 flex items-center gap-2 font-medium whitespace-nowrap');
            $('.dt-length label').html(function (_, html) {
                return html.replace('Show', '<span class="font-bold">Show</span>');
            });

            // Style search input
            $('.dt-search input').addClass('border rounded px-2 sm:px-3 py-1 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent');

            // Apply styles for pagination container and elements
            $('.dataTables_paginate').addClass('flex items-center gap-2');
            $('.dt-paging').addClass('flex items-center gap-2');
            $('.pagination').addClass('flex items-center gap-1 flex-wrap justify-center sm:justify-end');

            // Apply styles for pagination buttons
            $('.page-link').addClass('border rounded px-2 sm:px-3 py-1 text-sm hover:bg-gray-100 transition-colors');
            $('.page-item.active .page-link').addClass('bg-fuchsia-800 text-white hover:bg-stone-800');
            $('.page-item.disabled .page-link').addClass('opacity-50 cursor-not-allowed hover:bg-transparent');

            // Apply styles for page items (li)
            $('.dt-paging-button').addClass('mx-1');
            $('.dt-paging-button:first-child').removeClass('mx-1').addClass('mr-1');
            $('.dt-paging-button:last-child').removeClass('mx-1').addClass('ml-1');

            // Style info text
            $('.dataTables_info').addClass('text-sm text-gray-500');

            // Add hover effects to pagination buttons
            $('.page-link:not(.disabled)').hover(
                function () { $(this).addClass('bg-gray-100'); },
                function () { $(this).removeClass('bg-gray-100'); }
            );

            // Add responsive container classes if needed
            if (!$('.dataTables_wrapper').parent().hasClass('w-full.overflow-hidden')) {
                $('.dataTables_wrapper').wrap('<div class="w-full overflow-hidden"></div>');
            }
        }
    };

    return $(tableRef).DataTable({ ...defaultOptions, ...options });
};
