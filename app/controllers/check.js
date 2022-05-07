const turf = require("@turf/turf");
let max_distance = 150;
let send_loc_period =1/32
module.exports.bad_ip=[];


// Node class
class Node
{
    constructor(ip,time)
    {
        this.ip = ip;
        this.time=time;
        this.left = null;
        this.right = null;
        this.req_count=0
        this.periods_summation=0
    }
}

// Binary Search tree class
class BinarySearchTree
{
    constructor()
    {
        // root of a binary search tree
        this.root = null;
        this.inordered=[];
    }
    
    // insert data.
    insert(ip,time)
    {
        // Creating a node and initailising
        // with data
        var newNode = new Node(ip,time);
                        
        // root is null then node will
        // be added to the tree and made root.
        if(this.root === null)
            this.root = newNode;
        else
    
            // find the correct position in the
            // tree and add the node
            this.insertNode(this.root, newNode);
    }

    insertNode(node, newNode)
    {
        // if the data is less than the node
        // data move left of the tree
        if(newNode.ip < node.ip)
        {
            // if left is null insert node here
            if(node.left === null)
                node.left = newNode;
            else
    
                // if left is not null recur until
                // null is found
                this.insertNode(node.left, newNode);
        }
    
        // if the data is more than the node
        // data move right of the tree
        else
        {
            // if right is null insert node here
            if(node.right === null)
                node.right = newNode;
            else
    
                // if right is not null recur until
                // null is found
                this.insertNode(node.right,newNode);
        }
    }

    // remove(data)
    // helper method that calls the
    // removeNode with a given data
    remove(ip)
    {
        // root is re-initialized with
        // root of a modified tree.
        this.root = this.removeNode(this.root, ip);
    }
    
    // Method to remove node with a
    // given data
    // it recur over the tree to find the
    // data and removes it
    removeNode(node, key)
    {
            
        // if the root is null then tree is
        // empty
        if(node === null)
            return null;
    
        // if data to be delete is less than
        // roots data then move to left subtree
        else if(key < node.ip)
        {
            node.left = this.removeNode(node.left, key);
            return node;
        }
    
        // if data to be delete is greater than
        // roots data then move to right subtree
        else if(key > node.ip)
        {
            node.right = this.removeNode(node.right, key);
            return node;
        }
    
        // if data is similar to the root's data
        // then delete this node
        else
        {
            // deleting node with no children
            if(node.left === null && node.right === null)
            {
                node = null;
                return node;
            }
    
            // deleting node with one children
            if(node.left === null)
            {
                node = node.right;
                return node;
            }
            
            else if(node.right === null)
            {
                node = node.left;
                return node;
            }
    
            // Deleting node with two children
            // minumum node of the rigt subtree
            // is stored in aux
            var aux = this.findMinNode(node.right);
            node.ip = aux.ip;
    
            node.right = this.removeNode(node.right, aux.ip);
            return node;
        }
    
    }
                 
 

    // findMinNode()
    //  finds the minimum node in tree
    // searching starts from given node
    findMinNode(node)
    {
        // if left of a node is null
        // then it must be minimum node
        if(node.left === null)
            return node;
        else
            return this.findMinNode(node.left);
    }

    // inorder(node)
    // Performs inorder traversal of a tree
    clear_inorder(node)
    {
        if(node !== null)
        {
            this.clear_inorder(node.left);

            //clear ofline IPs.
            if (Math.round(new Date().getTime() / 1000) -node.time < 120){
                this.inordered.push(node);
            }

            this.clear_inorder(node.right);
        }
    }

    //balanced insertion of the tree.
    b_insert(beginning,end){
        if(end-beginning>0){
            let med=0
            if ((beginning+end)%2==0){
                med=((beginning+end)/2)-1;
            }
            else{
                med=((beginning+end)/2)-0.5;
            }
            this.insert(this.inordered[med].ip,this.inordered[med].time);
            this.b_insert(beginning,med);
            this.b_insert(med+1,end);
        }
    }

    //clear and balance the tree.
    clear_and_balance(){
        this.clear_inorder(this.root);
        this.root=null
        this.b_insert(0,this.inordered.length);
        this.inordered=[];
    }
    
    
    // search(ip) 
    search(ip)
    {
        return this.searchByNode(this.root,ip);
    }

    // search(node, ip)
    // search for a node with given data
    searchByNode(node, ip)
    {
    // if trees is empty return null
        if(node === null)
            return null;
    
        // if data is less than node's data
        // move left
        else if(ip < node.ip)
            return this.searchByNode(node.left, ip);
    
        // if data is less than node's data
        // move left
        else if(ip > node.ip)
            return this.searchByNode(node.right, ip);
    
        // if data is equal to the node data
        // return node
        else{
            node.req_count++;
            node.periods_summation+=Math.round(new Date().getTime() / 1000)-node.time;
            let node_c={ip:node.ip,time:node.time,req_count:node.req_count,periods_summation:node.periods_summation};
            node.time=Math.round(new Date().getTime() / 1000);
            return node_c;
        }
    }
}

module.exports. good_ips= new BinarySearchTree();
module.exports. r_good_ips= new BinarySearchTree();


module.exports.line_check = (name, map, stops) => {
    if (!name) {
        return false;
    }
    for (let i = 0; i < map.length; i++) {
        if (!map[i].lat) {
            return false;
        }
        if (!map[i].long) {
            return false;
        }
    }
    for (let i = 0; i < stops.length; i++) {
        if (!stops[i].name) {
            return false;
        }
        if (!stops[i].lat) {
            return false;
        }
        if (!stops[i].long) {
            return false;
        }
    }
    return true;
}

module.exports.line_is_new = (name, data) => {
    for (let i = 0; i < data.length; i++) {
        if (data[i].name == name) {
            return false;
        }
    }
    return true;
}

module.exports.bus_check = (bus_imei, line, data) => {
    if (!bus_imei) { return false; }
    if (!line) { return false; }
    if (this.line_is_new(line, data)) { return false; }
    return true;
}

module.exports.bus_is_new = (imei, buses) => {
    for (let j = 0; j < buses.length; j++) {
        if (buses[j].imei == imei) {
            return false;
        }
    }
    return true;
}

module.exports.buses_in_line = (name, buses) => {
    for (let i = 0; i < buses.length; i++) {
        if (buses[i].line == name) {
            return true;
        }
    }
    return false;
}


module.exports.bus_indx = (imei, data) => {
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].buses.length; j++) {
            if (data[i].buses[j].imei == imei) {
                return { i, j };
            }
        }
    }
}

module.exports.posted_location = (q) => {
    if (!q.longitude || isNaN(q.longitude)) {
        return false;
    }
    if (!q.latitude || isNaN (q.latitude)) {
        return false;
    }
    return true;
}

module.exports.in_line = (lat, long, map) => {
    let line_array=[];
    for(let j=1;j<map.length;j++){
        line_array.push([map[j].lat,map[j].long])
    }

    var pt = turf.point([lat, long]);
    var line = turf.lineString(line_array);
    var distance = (turf.pointToLineDistance(pt, line, {units: 'kilometers'}))/1000;
    if(distance>max_distance)return false;
    
    return true;
}

module.exports.is_bad_ip =(ip)=>{
    for (let i =0;i<this.bad_ip.length;i++){
        if(ip==this.bad_ip[i]){
            return true;
        }
    }
    return false;
}

module.exports.ip_check=(ip,tree)=> {
    if(tree=="add"){
        let n =this.good_ips.search(ip);

        if (n==null){
            this.good_ips.insert(ip,Math.round(new Date().getTime() / 1000));
            return true;
        }
        
        if(( n.periods_summation/n.req_count) < send_loc_period){
            this.bad_ip.push(ip);
            this.good_ips.remove(ip);
            return false;
        }
        return true;
    }
    else if (tree=="remove"){
        let n =this.r_good_ips.search(ip);

        if (n==null){
            this.r_good_ips.insert(ip,Math.round(new Date().getTime() / 1000));
            return true;
        }
        
        if(( n.periods_summation/n.req_count) < send_loc_period){
            this.bad_ip.push(ip);
            this.r_good_ips.remove(ip);
            return false;
        }
        
        return true;
    }
    else{return "a7a"}
    
}
