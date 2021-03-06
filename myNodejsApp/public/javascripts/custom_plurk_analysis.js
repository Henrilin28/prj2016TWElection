/* twitter */
'use strict';
(function($) {
  /* Plurk Handler */
  window.plurk_analysis_handler = window.plurk_analysis_handler || {
    get_analysis_collection_by_lang_type : function(){
      var _this = this;
      // create an AJAX call to get data
      $.ajax({
          data: {
            token: 'IcsEegBbPOgerGEhRAEBYLRsSLtAA',
          },
          type: 'POST', // GET or POST
          url: '/services/get_plurk_posts_analysis_collection_by_lang_type', // the file to call
          success: function(res) {
              if(res.request_status === 'successful'){
                  _this.append_categorized_data(res.collecion, res.count_of_total_tweets);
                  _this.display_plurk_posts_chart(res.collecion);
              }else{
                  console.log('fail...');
              };
          }
      });
    },
    append_categorized_data : function(arg_collection, arg_count_of_total_tweets){
      //
      var min_timestamp = undefined, max_timestamp = undefined;
      for(var ith_key in arg_collection){
        //
        var timestamp_set = arg_collection[ith_key]['timestamp_set'];
        var total_count = 0;
        for(var jth_key in timestamp_set){
          //
          if(min_timestamp === undefined){
            min_timestamp = jth_key;
          }else{
            min_timestamp = Math.min(min_timestamp, jth_key);
          }

          if(max_timestamp === undefined){
            max_timestamp = jth_key;
          }else{
            max_timestamp = Math.max(max_timestamp, jth_key);
          }
          total_count += timestamp_set[jth_key];
        }

        //
        var content = '<li class="list-group-item">' +
                      ith_key +
                      '<span class="label label-warning label-pill pull-right">' + total_count + ' (' + ( total_count / arg_count_of_total_tweets * 100 ).toFixed(2) + '%)' + '</span>' +
                      '</li>';
        $('ul#categorized_plurk_posts_collection').append(content);
      }
      var min_date = new Date(min_timestamp),
          max_date = new Date(max_timestamp);
      $('p#categorized_plurk_posts_collection_period').prepend('From ' + ( min_date.getMonth() + 1) + '-' +
                                                              min_date.getDate() + '-' +
                                                              min_date.getFullYear() +
                                                  ' To ' + ( max_date.getMonth() + 1) + '-' +
                                                            max_date.getDate() + '-' +
                                                            max_date.getFullYear() );
    },
    display_plurk_posts_chart : function(arg_collection){
      var rearranged_collection = {};
      for(var ith_key in arg_collection){
        //
        for(var jth_key in arg_collection[ith_key]['timestamp_set']){
          //
          if(!rearranged_collection.hasOwnProperty(jth_key)){
            //
            rearranged_collection[jth_key] = arg_collection[ith_key]['timestamp_set'][jth_key];
          }else{
            //
            rearranged_collection[jth_key] += arg_collection[ith_key]['timestamp_set'][jth_key];
          }
        }
      }
      // console.log(rearranged_collection);

      //
      var margin = {top: 10, right: 30, bottom: 30, left: 60},
                    width = 480 - margin.left - margin.right,
                    height = 250 - margin.top - margin.bottom;

      var x = d3.time.scale().range([0, width]);
      var y0 = d3.scale.linear().range([height, 0]);

      var xAxis = d3.svg.axis().scale(x)
          .orient("bottom").ticks(5);

      var yAxisLeft = d3.svg.axis().scale(y0)
          .orient("left").ticks(5,"s");

      var valueline = d3.svg.line()
          .x(function(d) { return x(d.date); })
          .y(function(d) { return y0(d.value); });
          
      var svg = d3.select("div#plurk_posts_chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", 
                    "translate(" + margin.left + "," + margin.top + ")");

      // make grid
      var make_y_axis = function() {        
          return d3.svg
                  .axis()
                  .scale(y0)
                  .orient("left")
                  .ticks(5)
      }

      svg.append("svg:g")         
          .attr("class", "grid")
          .call(make_y_axis().tickSize(-width, 0, 0).tickFormat( "" ));
      /* end of make grid */

      var build_chart = function(arg_rearranged_collection){
        //
        var new_collection_ary = [];
        for(var ith_key in arg_rearranged_collection){
          //
          new_collection_ary.push({ date: ( new Date( Number(ith_key) ) ), value: arg_rearranged_collection[ith_key] });
        }

        new_collection_ary.sort(function(a, b){
          //
          return a.date - b.date;
        });

        //
        x.domain(d3.extent(new_collection_ary, function(d) { return d.date; }));
        y0.domain([0, d3.max(new_collection_ary, function(d) {
            return Math.max(d.value); })]);

        svg.append("path")        // Add the valueline path.
           .attr("class", "line_1")
           .attr("d", valueline(new_collection_ary));

        svg.append("g")            // Add the X Axis
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        
        svg.append("g")
            .attr("class", "y axis")
            .style("fill", "#c79825")
            .call(yAxisLeft)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("dy", ".4em")
            .style("text-anchor", "end")
            .style("font-size", 12)
            .text("Posts");

        // // mouseover event
        var bisectDate = d3.bisector(function(d) { return d.date; }).left,
            formatValue = d3.format(",.0f"),
            formatTweets = function(d) { return formatValue(d); };
        
        var div = d3.select("div#summary_tip").append("div")   
                    .attr("class", "tooltip")               
                    .style("opacity", 0);
        
        var focus = svg.append("g")
                       .attr("class", "focus")
                       .style("display", "none");

        focus.append("circle")
            .attr("r", 3);

        focus.append("text")
          .attr("x", 9)
          .attr("dy", ".3em");
          
        svg.append("rect")
          .attr("class", "overlay")
          .attr("width", width)
          .attr("height", height)
          .on("mouseout", function() {
              div.transition()        
                  .duration(300)      
                  .style("opacity", 0);
          })
          .on("mousemove", function(){
                            var x0 = x.invert(d3.mouse(this)[0]),
                                i = bisectDate(new_collection_ary, x0, 1),
                                d0 = new_collection_ary[i - 1],
                                d1 = new_collection_ary[i];

                            if(d0 && d1){
                              var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                              div.transition()        
                                  .duration(200)
                                  .style("opacity", .9);      
                              div.html('<div><strong>Date:&nbsp;' + d.date.toLocaleDateString() + '</strong><br/>' +
                                      '<p><label>Posts:&nbsp;</label>' + formatTweets(d.value) + '</p>' +
                                      '</div>')  
                                    .style("left", (d3.event.pageX + 10) + "px")     
                                    .style("top", (d3.event.pageY - 10) + "px");
                            }
          });
      }

      build_chart(rearranged_collection);
      // end of build_chart
    },
    get_plurk_posts : function(){
      //
      var _this = this;
      // create an AJAX call to get data
      $.ajax({
          data: {
            token: 'IDQWpckbiKLZUotOgerGEhRAEBwxYA',
          },
          type: 'POST', // GET or POST
          url: '/services/get_plurk_posts', // the file to call
          success: function(res) {
              if(res.request_status === 'successful'){
                  _this.append_plurk_posts(res.posts);
              }else{
                  console.log('fail...');
              };
          }
      });
    },
    append_plurk_posts : function(arg_posts){
      //
      var _this = this;
      arg_posts.sort(function(elem_1, elem_2){
        //
        return ( elem_2['post']['replurkers_count'] - elem_1['post']['replurkers_count'] ) || ( (new Date(elem_2['posted']).getTime()) - (new Date(elem_1['posted']).getTime()) );
      });
      var top_five_posts = arg_posts.slice(0,6);
      // console.log(top_five_posts);
      //
      var top_five_posts_elem = $('div#top_five_posts_with_highest_replurkers_count');
      top_five_posts_elem.empty();
      for( var jth in top_five_posts){
        //
        top_five_posts_elem.append('<div class="col-sm-6 col-xs-12 top_plurk_cell">' +
                                    '<span>Replurk&nbsp;Counts:&nbsp;' + top_five_posts[jth]['post']['replurkers_count'] + '</span><br/>' +
                                    '<span>' + (new Date(top_five_posts[jth]['posted'])) + '</span><br/>' +
                                    '<p>' + top_five_posts[jth]['post']['content'] + '</p>' +
                                    '</div>');
      }
    },
    prepend_elem_to_ary : function(arg_val, arg_ary){
      //
      var new_ary = arg_ary.slice(0);
      new_ary.unshift(arg_val);
      return new_ary;
    }
  }

  // start analysis
  window.plurk_analysis_handler.get_analysis_collection_by_lang_type();

  window.plurk_analysis_handler.get_plurk_posts();
  /* end */

})(jQuery);
