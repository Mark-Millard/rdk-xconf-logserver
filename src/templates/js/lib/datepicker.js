var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    var today = year+"/"+month+"/"+day;
    var startEp, endEp;
    var rangeStart, rangeEnd;
    var gap, interval;
    //console.log(startEp+"  "+endEp); //1549897200    1550502000
    var filteredR=""; 
    var filteredM="";
    var pickerStartEp;
    var pickerEndEp;
    startEp = moment(today).unix(); //unix time  00:00:00
    endEp = startEp + 86399; //unix time 23:59:59
    rangeStart = startEp;
    rangeEnd = endEp;

	function dateRangePicker(){
      $(function() {
        $('input[name="start_date"]').daterangepicker({
          singleDatePicker: true,
          showDropdowns: true,
          autoUpdateInput: false
        }, function(start, end, label) {
          
        });
        $('input[name="start_date"]').on('apply.daterangepicker', function(ev, picker) {
          $(this).val(picker.startDate.format('YYYY-MM-DD'));
        });
      });
      $(function() {
        $('input[name="end_date"]').daterangepicker({
          singleDatePicker: true,
          showDropdowns: true,
          autoUpdateInput: false
        }, function(start, end, label) {
          
        });
        $('input[name="end_date"]').on('apply.daterangepicker', function(ev, picker) {
          $(this).val(picker.startDate.format('YYYY-MM-DD'));
        });
      });    
	}
	dateRangePicker();