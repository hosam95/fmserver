let max_distance = 100;
let send_loc_period =5
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
            this.insert(inordered[med].ip,inordered[med].time);
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
            let node_c=node;
            node.time=Math.round(new Date().getTime() / 1000);
            return node_c;
        }
    }
}

module.exports. good_ips= new BinarySearchTree();


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
    for (let i = 1; i < map.length; i++) {
        if (getDistanceFromLatLonInKm(lat, long, lat + distance(map[i - 1].lat, map[i - 1].long, map[i].lat, map[i].long, lat, long), long) * 1000 < max_distance) {
            return true;
        }
    }
    return false;
}


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function distance(t1, g1, t2, g2, T, G) {
    return ((T * g1) - (T * g2) - (G * t1) + (G * t2) - (g1 * t2) + (g2 * t1)) / Math.sqrt((t1 * t1) + (t2 * t2) - (2 * t1 * t2) + (g1 * g1) + (g2 * g2) - (2 * g1 * g2));
}

module.exports.is_bad_ip =(ip)=>{
    for (let i =0;i<this.bad_ip.length;i++){
        if(ip==this.bad_ip[i]){
            return true;
        }
    }
    return false;
}

module.exports.ip_check=(ip)=> {
    let n =this.good_ips.search(ip);
    if (n==null){
        this.good_ips.insert(ip,Math.round(new Date().getTime() / 1000));
        return true;
    }

    if(n.time - Math.round(new Date().getTime() / 1000) < send_loc_period-1){
        this.bad_ip.push(ip);
        this.good_ips.remove(ip);
        return false;
    }
    
    return true;
}