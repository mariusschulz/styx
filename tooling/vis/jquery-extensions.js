(function() {
    $.fn.setCaretPosition = function(position) {
        return this.each(function() {
            if (this.setSelectionRange) {
                this.focus();
                this.setSelectionRange(position, position);
            } else if (this.createTextRange) {
                var range = this.createTextRange();
                range.collapse(true);
                range.moveEnd("character", position);
                range.moveStart("character", position);
                range.select();
            }
        });
    };
}());
