define([
       "jquery", "underscore", "backbone"
      , "views/temp-snippet-view"
      , "helper/pubsub"
      , "text!templates/app/renderform.html"
      , "views/row-container-view"
      , "collections/rowcontainer-collection"
], function(
  $, _, Backbone
  , TempSnippetView
  , PubSub
  , _renderForm
  , RowContainerView
  , RowContainerCollection
){
  return Backbone.View.extend({
    tagName: "fieldset"
    , initialize: function(){
      //this.collection.on("add", this.render, this);
      this.collection.on("remove", this.render, this);
      this.collection.on("change", this.render, this);
      PubSub.on("UniqueIdGiven", this.prepare_render, this);
      PubSub.on("mySnippetDrag", this.handleSnippetDrag, this);
      PubSub.on("tempMove", this.handleTempMove, this);
      PubSub.on("tempDrop", this.handleTempDrop, this);
      PubSub.on("rowContainerRendered", this.render_controls, this);
      this.$build = $("#build");
      this.build = document.getElementById("build");
      this.buildBCR = this.build.getBoundingClientRect();
      this.renderForm = _.template(_renderForm);
      this.render();
    }
  	, prepare_render: function(snippet){
  		_.map(this.collection.models, function(snippet, k){
  			if (snippet.attributes.fields.id) {
	  			var snippetType = snippet.attributes.fields.id.type;
	  	  		if (snippetType == "rowcontainer") {
	  	      	  //initialize row-container view
	  	  		  if (typeof(snippet.row_container_views) == 'undefined') {
	  	  			snippet.row_container_views = {}
	  	  		  } 
	  	  		  if (!(snippet in snippet.row_container_views)){
	  	  			  var rcv = new RowContainerView({model: snippet, collection: new RowContainerCollection([])});
	  	  			  snippet.row_container_views[snippet] = rcv;
	  	  		  } else {
	  	  			snippet.row_container_views[snippet].delegateEvents();
	  	  		  }
	  	  		}
  			}
  		});
  		this.render();
  	}
  	, render_controls: function(){
  		var that = this;
  		var rendered_collection = this.collection.renderAllClean();
        var text = _.map(rendered_collection, function(e){return e.html()}).join("\n")
        var rendered = that.renderForm({
            multipart: this.collection.containsFileType(),
            text: text
          })
        $("#render").val(rendered);
        
        var rendered_collection_json = this.collection.renderAllJSON();
        $("#render_json").val(rendered_collection_json);
  	}
    , render: function(){
      //Render Snippet Views
      this.$el.empty();
      var that = this;
      var containsFile = false;
      _.each(this.collection.renderAll(), function(snippet){
        that.$el.append(snippet);
      });
      var rendered_collection = this.collection.renderAllClean();
      var text = _.map(rendered_collection, function(e){return e.html()}).join("\n")
      var rendered = that.renderForm({
          multipart: this.collection.containsFileType(),
          text: text
        })
      $("#render").val(rendered);

      var rendered_collection_json = this.collection.renderAllJSON();
      $("#render_json").val(rendered_collection_json);

      this.$el.appendTo("#build div#target");
      this.delegateEvents();
    }

    , getTarget: function(eventX, eventY){
      var myFormBits = $(this.$el.find(".drop_target"));
      var topelement = _.find(myFormBits, function(renderedSnippet) {
    	if (eventY >= $(renderedSnippet).position().top  && eventY <= ($(renderedSnippet).position().top + $(renderedSnippet).height())) {
          return true;
        }
        else {
          return false;
        }
      });
      if (topelement){
        return topelement;
      }
    }

    , handleSnippetDrag: function(mouseEvent, snippetModel) {
      $("body").append(new TempSnippetView({model: snippetModel}).render());
      this.collection.remove(snippetModel);
      PubSub.trigger("newTempPostRender", mouseEvent);
    }

    , handleTempMove: function(mouseEvent){
      $(".drop_target").removeClass("hovered");
      if(mouseEvent.pageX >= this.$el.offset().left &&
  	     mouseEvent.pageX < (this.$el.offset().left + this.$el.width()) &&
         mouseEvent.pageY >= this.$el.offset().top &&
         mouseEvent.pageY < (this.$el.offset().top + this.$el.height())){
        var target = $(this.getTarget(mouseEvent.pageX, mouseEvent.pageY));
        if (target){target.addClass('hovered');}
      } else {
        $(".drop_target").removeClass("hovered");
      }
    }

    , handleTempDrop: function(mouseEvent, model, index){
        var index = $(".drop_target:not(.drop_sub_target)").index($(".drop_target.hovered"));
        if (index>-1){
        	$(".drop_target").removeClass("hovered");
        	this.collection.add(model,{at: index+1});
        }
    }
  })
});
