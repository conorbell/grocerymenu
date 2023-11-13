import React, {useRef} from "react";
import { Sphere, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";

const PointCircle = () => {

    const ref = useRef(); 
    
    const group = useRef();
    const {nodes, materials} = useGLTF('solo/public/models/spartan_armour_mkv_-_halo_reach/scene.gltf')

    useFrame(({clock}) =>{
        ref.current.rotation.z = clock.getElapsedTime() * 0.5; 
    })
    return (
        <group ref={group}></group>
    )
}

export default PointCircle